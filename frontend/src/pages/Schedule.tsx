import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { api, Allocation } from "../utils/api";
import "./Schedule.css";

export default function Schedule() {
  const { user } = useAuth();
  const [view, setView] = useState<"grid" | "gantt">("grid");
  const [gridMode, setGridMode] = useState<"byEmployee" | "byJob">("byEmployee");
  const [selectedTradie, setSelectedTradie] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split("T")[0];
  });

  const queryClient = useQueryClient();

  const { data: gridData } = useQuery({
    queryKey: ["schedule", "grid", weekStart],
    queryFn: () => api.schedule.grid(weekStart),
    enabled: (user?.role === "SystemAdmin" || user?.role === "OfficeStaff") && view === "grid",
  });

  const { data: ganttData } = useQuery({
    queryKey: ["schedule", "gantt", selectedTradie, weekStart],
    queryFn: () => api.schedule.gantt(selectedTradie!, weekStart),
    enabled: view === "gantt" && selectedTradie !== null,
  });

  const { data: mySchedule } = useQuery({
    queryKey: ["schedule", "mySchedule", weekStart],
    queryFn: () => api.schedule.mySchedule(weekStart),
    enabled: user?.role === "TradePerson",
  });

  const { data: tradies } = useQuery({
    queryKey: ["tradies"],
    queryFn: () => api.tradies.list(),
    enabled: user?.role === "SystemAdmin" || user?.role === "OfficeStaff",
  });

  const { data: jobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.jobs.list(),
    enabled: user?.role === "SystemAdmin" || user?.role === "OfficeStaff",
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.schedule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });

  const getWeekDays = () => {
    const start = new Date(weekStart);
    const days = [];
    for (let i = 0; i < 5; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getPeriods = () => {
    const days = getWeekDays();
    const periods: Array<{ date: Date; period: "AM" | "PM" }> = [];
    days.forEach((day) => {
      periods.push({ date: new Date(day), period: "AM" });
      periods.push({ date: new Date(day), period: "PM" });
    });
    return periods;
  };

  const findAllocation = (tradieId: number, date: Date, period: "AM" | "PM") => {
    const dateStr = date.toISOString().split("T")[0];
    return gridData?.tradies
      .find((t) => t.id === tradieId)
      ?.allocations.find(
        (a) => a.date.split("T")[0] === dateStr && a.period === period,
      );
  };

  const findAllocationsByJob = (jobId: number, date: Date, period: "AM" | "PM") => {
    const dateStr = date.toISOString().split("T")[0];
    return gridData?.tradies
      .flatMap((t) =>
        t.allocations
          .filter(
            (a) =>
              a.jobId === jobId &&
              a.date.split("T")[0] === dateStr &&
              a.period === period,
          )
          .map((a) => ({
            ...a,
            tradePerson: {
              ...t,
              user: t.user,
            },
          })),
      ) || [];
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + (direction === "next" ? 7 : -7));
    setWeekStart(d.toISOString().split("T")[0]);
  };

  if (user?.role === "TradePerson") {
    return (
      <div className="schedule-page">
        <div className="schedule-header">
          <h1>My Schedule</h1>
          <div className="week-controls">
            <button onClick={() => handleWeekChange("prev")}>← Prev</button>
            <span>
              {new Date(weekStart).toLocaleDateString()} -{" "}
              {new Date(new Date(weekStart).setDate(new Date(weekStart).getDate() + 6)).toLocaleDateString()}
            </span>
            <button onClick={() => handleWeekChange("next")}>Next →</button>
          </div>
        </div>
        <div className="gantt-view">
          {mySchedule?.allocations.map((alloc) => (
            <div key={alloc.id} className="gantt-item">
              <div className="gantt-date">
                {new Date(alloc.date).toLocaleDateString()} {alloc.period}
              </div>
              <div className="gantt-job">
                <strong>{alloc.job.name}</strong>
                <div>{alloc.job.client.name}</div>
              </div>
            </div>
          ))}
          {(!mySchedule || mySchedule.allocations.length === 0) && (
            <p>No allocations this week</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <h1>Schedule</h1>
        <div className="view-controls">
          <button
            onClick={() => setView("grid")}
            className={view === "grid" ? "active" : ""}
          >
            Overview
          </button>
          <button
            onClick={() => setView("gantt")}
            className={view === "gantt" ? "active" : ""}
          >
            Tradie Schedule
          </button>
        </div>
        <div className="week-controls">
          <button onClick={() => handleWeekChange("prev")}>← Prev</button>
          <span>
            {new Date(weekStart).toLocaleDateString()} -{" "}
            {new Date(new Date(weekStart).setDate(new Date(weekStart).getDate() + 6)).toLocaleDateString()}
          </span>
          <button onClick={() => handleWeekChange("next")}>Next →</button>
        </div>
      </div>

      {view === "grid" && (
        <div className="grid-view">
          <div className="grid-mode-toggle">
            <label>View by:</label>
            <div className="toggle-buttons">
              <button
                onClick={() => setGridMode("byEmployee")}
                className={gridMode === "byEmployee" ? "active" : ""}
              >
                Employee
              </button>
              <button
                onClick={() => setGridMode("byJob")}
                className={gridMode === "byJob" ? "active" : ""}
              >
                Job
              </button>
            </div>
          </div>
          {!gridData && gridMode === "byEmployee" && (
            <div style={{ padding: "2rem", textAlign: "center" }}>Loading schedule data...</div>
          )}
          {!jobs && gridMode === "byJob" && (
            <div style={{ padding: "2rem", textAlign: "center" }}>Loading jobs data...</div>
          )}
          {(gridMode === "byEmployee" ? gridData : jobs) && (
          <table className="schedule-grid">
            <thead>
              <tr>
                <th>{gridMode === "byEmployee" ? "Employee" : "Job"}</th>
                {getWeekDays().map((day) => (
                  <th key={day.toISOString()} colSpan={2}>
                    {day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </th>
                ))}
              </tr>
              <tr>
                <th></th>
                {getWeekDays().map((day) => (
                  <React.Fragment key={day.toISOString()}>
                    <th>AM</th>
                    <th>PM</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridMode === "byEmployee" ? (
                // Employee-centric view (original)
                gridData?.tradies.map((tradie) => (
                  <tr key={tradie.id}>
                    <td className="row-label">{tradie.user.name}</td>
                    {getPeriods().map(({ date, period }) => {
                      const alloc = findAllocation(tradie.id, date, period);
                      return (
                        <td key={`${date.toISOString()}-${period}`} className="schedule-cell">
                          {alloc ? (
                            <div className="allocation-cell">
                              <div className="job-name">{alloc.job.name}</div>
                              <div className="client-name">{alloc.job.client.name}</div>
                              <button
                                onClick={() => {
                                  if (confirm("Delete this allocation?")) {
                                    deleteMutation.mutate(alloc.id);
                                  }
                                }}
                                className="btn-delete-small"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div className="empty-cell">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                // Job-centric view (new)
                jobs && jobs.length > 0 ? (
                  jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="row-label">
                        <div className="job-label">
                          <strong>{job.name}</strong>
                          <div className="client-label">{job.client.name}</div>
                        </div>
                      </td>
                      {getPeriods().map(({ date, period }) => {
                        const allocations = findAllocationsByJob(job.id, date, period);
                        return (
                          <td key={`${date.toISOString()}-${period}`} className="schedule-cell">
                            {allocations.length > 0 ? (
                              <div className="allocation-cell">
                                {allocations.map((alloc) => (
                                  <div key={alloc.id} className="employee-allocation">
                                    <div className="employee-info">
                                      <div className="employee-name">
                                        {alloc.tradePerson?.user?.name || "Unknown"}
                                      </div>
                                      {alloc.tradePerson?.roles && alloc.tradePerson.roles.length > 0 && (
                                        <div className="employee-roles">
                                          {alloc.tradePerson.roles.map((r) => r.tradeRole.name).join(", ")}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (confirm("Delete this allocation?")) {
                                          deleteMutation.mutate(alloc.id);
                                        }
                                      }}
                                      className="btn-delete-small"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="empty-cell">-</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} style={{ textAlign: "center", padding: "2rem" }}>
                      No jobs found. Please create jobs first.
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
          )}
        </div>
      )}

      {view === "gantt" && (
        <div className="gantt-container">
          <div className="gantt-selector">
            <label>Select Tradie:</label>
            <select
              value={selectedTradie || ""}
              onChange={(e) => setSelectedTradie(Number(e.target.value) || null)}
            >
              <option value="">Select a tradie</option>
              {tradies?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.name}
                </option>
              ))}
            </select>
          </div>
          {selectedTradie && ganttData && (
            <div className="gantt-view">
              {ganttData.allocations.map((alloc) => (
                <div key={alloc.id} className="gantt-item">
                  <div className="gantt-date">
                    {new Date(alloc.date).toLocaleDateString()} {alloc.period}
                  </div>
                  <div className="gantt-job">
                    <strong>{alloc.job.name}</strong>
                    <div>{alloc.job.client.name}</div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Delete this allocation?")) {
                        deleteMutation.mutate(alloc.id);
                      }
                    }}
                    className="btn-delete-small"
                  >
                    ×
                  </button>
                </div>
              ))}
              {ganttData.allocations.length === 0 && <p>No allocations this week</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


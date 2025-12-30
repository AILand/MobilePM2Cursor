import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { api, Job } from "../utils/api";
import "./Schedule.css";

interface AllocationSlot {
  date: string;
  period: "AM" | "PM";
  tradePersonId?: number;
  jobId?: number;
}

export default function Schedule() {
  const { user } = useAuth();
  const [view, setView] = useState<"grid" | "gantt">("grid");
  const [gridMode, setGridMode] = useState<"byEmployee" | "byJob">("byJob");
  const [selectedTradie, setSelectedTradie] = useState<number | null>(null);
  const [allocationSlot, setAllocationSlot] = useState<AllocationSlot | null>(null);
  const [selectedRoleFilters, setSelectedRoleFilters] = useState<number[]>([]);
  const [selectedClientFilter, setSelectedClientFilter] = useState<number | null>(null);
  const [selectedJobFilter, setSelectedJobFilter] = useState<number | null>(null);
  const [showAllTradies, setShowAllTradies] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
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

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.clients.list(),
    enabled: user?.role === "SystemAdmin" || user?.role === "OfficeStaff",
  });

  const { data: tradeRoles } = useQuery({
    queryKey: ["tradeRoles"],
    queryFn: () => api.tradies.roles(),
    enabled: user?.role === "SystemAdmin" || user?.role === "OfficeStaff",
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.schedule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { jobId: number; tradePersonId: number; date: string; period: "AM" | "PM" }) =>
      api.schedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setAllocationSlot(null);
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Job> }) =>
      api.jobs.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setEditingJob(null);
    },
  });

  const handleJobEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingJob) return;
    
    const formData = new FormData(e.currentTarget);
    const requirements: Array<{ tradeRoleId: number; requiredSlots: number }> = [];
    
    tradeRoles?.forEach((role) => {
      const slots = formData.get(`req_${role.id}`);
      if (slots && Number(slots) > 0) {
        requirements.push({
          tradeRoleId: role.id,
          requiredSlots: Number(slots),
        });
      }
    });

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      clientId: Number(formData.get("clientId")),
      materials: formData.get("materials") as string || undefined,
      requirements,
    };

    updateJobMutation.mutate({ id: editingJob.id, data });
  };

  const handleAddAllocation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!allocationSlot) return;
    
    const formData = new FormData(e.currentTarget);
    const selectedId = Number(formData.get("selection"));
    
    if (!selectedId) return;

    createMutation.mutate({
      jobId: allocationSlot.jobId || selectedId,
      tradePersonId: allocationSlot.tradePersonId || selectedId,
      date: allocationSlot.date,
      period: allocationSlot.period,
    });
  };

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

  // Get available jobs for a tradie on a specific slot (jobs not already assigned to them)
  const getAvailableJobsForTradie = (tradePersonId: number, date: string, period: "AM" | "PM") => {
    if (!jobs || !gridData) return [];
    
    // Find what job this tradie is already assigned to for this slot
    const tradie = gridData.tradies.find((t) => t.id === tradePersonId);
    const existingAllocation = tradie?.allocations.find(
      (a) => a.date.split("T")[0] === date && a.period === period
    );
    
    // If they already have an allocation, they can't be assigned to anything else
    if (existingAllocation) return [];
    
    return jobs;
  };

  // Get available tradies for a job on a specific slot (tradies not already busy)
  const getAvailableTradiesForSlot = (date: string, period: "AM" | "PM", roleFilters: number[] = []) => {
    if (!tradies || !gridData) return [];
    
    // Find tradies who are NOT already assigned to any job for this slot
    const busyTradieIds = gridData.tradies
      .filter((t) => 
        t.allocations.some((a) => a.date.split("T")[0] === date && a.period === period)
      )
      .map((t) => t.id);
    
    let available = tradies.filter((t) => !busyTradieIds.includes(t.id));
    
    // If role filters are selected, only show tradies with those roles
    if (roleFilters.length > 0) {
      available = available.filter((t) =>
        t.roles.some((r) => roleFilters.includes(r.tradeRole.id))
      );
    }
    
    return available;
  };

  const handleRoleFilterToggle = (roleId: number) => {
    setSelectedRoleFilters((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const clearRoleFilters = () => {
    setSelectedRoleFilters([]);
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
          {mySchedule?.allocations.map((alloc) => {
            const date = new Date(alloc.date);
            const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
            const dateDisplay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return (
              <div key={alloc.id} className={`gantt-item gantt-item-${alloc.period.toLowerCase()}`}>
                <div className="gantt-date">
                  <span className="gantt-day">{dayName}</span>
                  <span className="gantt-date-text">{dateDisplay}</span>
                  <span className={`gantt-period gantt-period-${alloc.period.toLowerCase()}`}>{alloc.period}</span>
                </div>
                <div className="gantt-job">
                  <strong>{alloc.job.name}</strong>
                  <div>{alloc.job.client.name}</div>
                </div>
              </div>
            );
          })}
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

      {/* Allocation Modal */}
      {allocationSlot && (
        <div className="modal-overlay" onClick={() => setAllocationSlot(null)}>
          <div className="modal-content allocation-modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {allocationSlot.tradePersonId ? "Select Job" : "Select Tradie"}
            </h2>
            <p className="modal-subtitle">
              {new Date(allocationSlot.date).toLocaleDateString("en-US", { 
                weekday: "long", 
                month: "short", 
                day: "numeric" 
              })} - {allocationSlot.period}
            </p>
            {(() => {
              // For job selection (employee view), no role filter needed
              if (allocationSlot.tradePersonId) {
                const availableJobs = getAvailableJobsForTradie(
                  allocationSlot.tradePersonId,
                  allocationSlot.date,
                  allocationSlot.period
                );
                
                if (availableJobs.length === 0) {
                  return (
                    <div className="no-options-message">
                      <p>This employee already has an assignment for this time slot.</p>
                      <div className="form-actions">
                        <button type="button" onClick={() => setAllocationSlot(null)} className="btn-secondary">
                          Close
                        </button>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <form onSubmit={handleAddAllocation}>
                    <div className="form-group">
                      <label>Job</label>
                      <select name="selection" required>
                        <option value="">Select a job...</option>
                        {availableJobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.name} ({job.client.name})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                        {createMutation.isPending ? "Adding..." : "Add Allocation"}
                      </button>
                      <button type="button" onClick={() => setAllocationSlot(null)} className="btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </form>
                );
              }
              
              // For tradie selection (job view), include role filter
              const allAvailableTradies = getAvailableTradiesForSlot(
                allocationSlot.date,
                allocationSlot.period,
                []
              );
              
              const filteredTradies = getAvailableTradiesForSlot(
                allocationSlot.date,
                allocationSlot.period,
                selectedRoleFilters
              );
              
              if (allAvailableTradies.length === 0) {
                return (
                  <div className="no-options-message">
                    <p>All tradies are already assigned for this time slot.</p>
                    <div className="form-actions">
                      <button type="button" onClick={() => setAllocationSlot(null)} className="btn-secondary">
                        Close
                      </button>
                    </div>
                  </div>
                );
              }
              
              return (
                <form onSubmit={handleAddAllocation}>
                  {/* Role Filter */}
                  {tradeRoles && tradeRoles.length > 0 && (
                    <div className="form-group">
                      <label>Filter by Trade Role</label>
                      <div className="role-filter-chips">
                        {tradeRoles.map((role) => (
                          <button
                            key={role.id}
                            type="button"
                            className={`role-chip ${selectedRoleFilters.includes(role.id) ? "active" : ""}`}
                            onClick={() => handleRoleFilterToggle(role.id)}
                          >
                            {role.name}
                          </button>
                        ))}
                        {selectedRoleFilters.length > 0 && (
                          <button
                            type="button"
                            className="role-chip clear-btn"
                            onClick={clearRoleFilters}
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label>
                      Tradie {selectedRoleFilters.length > 0 && `(${filteredTradies.length} available)`}
                    </label>
                    {filteredTradies.length === 0 ? (
                      <p className="filter-no-results">No tradies match the selected role filters.</p>
                    ) : (
                      <select name="selection" required>
                        <option value="">Select a tradie...</option>
                        {filteredTradies.map((tradie) => (
                          <option key={tradie.id} value={tradie.id}>
                            {tradie.user.name} - {tradie.roles.map((r) => r.tradeRole.name).join(", ")}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      disabled={createMutation.isPending || filteredTradies.length === 0}
                    >
                      {createMutation.isPending ? "Adding..." : "Add Allocation"}
                    </button>
                    <button type="button" onClick={() => setAllocationSlot(null)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* Job Edit Modal */}
      {editingJob && (
        <div className="modal-overlay" onClick={() => setEditingJob(null)}>
          <div className="modal-content job-edit-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Job</h2>
            <form onSubmit={handleJobEditSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input name="name" defaultValue={editingJob.name} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" defaultValue={editingJob.description || ""} rows={3} />
              </div>
              <div className="form-group">
                <label>Client</label>
                <select name="clientId" defaultValue={editingJob.clientId} required>
                  <option value="">Select a client</option>
                  {clients?.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Materials</label>
                <input name="materials" defaultValue={editingJob.materials || ""} />
              </div>
              <div className="form-group">
                <label>Requirements (half-day slots per role)</label>
                <div className="requirements-grid">
                  {tradeRoles?.map((role) => (
                    <div key={role.id} className="requirement-item">
                      <label>{role.name}</label>
                      <input
                        type="number"
                        name={`req_${role.id}`}
                        min="0"
                        defaultValue={
                          editingJob.requirements.find((r) => r.tradeRoleId === role.id)
                            ?.requiredSlots || 0
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={updateJobMutation.isPending}>
                  {updateJobMutation.isPending ? "Updating..." : "Update"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {view === "grid" && (
        <div className="grid-view">
          <div className="grid-mode-toggle">
            <label>View by:</label>
            <div className="toggle-buttons">
              <button
                onClick={() => setGridMode("byJob")}
                className={gridMode === "byJob" ? "active" : ""}
              >
                Job
              </button>
              <button
                onClick={() => setGridMode("byEmployee")}
                className={gridMode === "byEmployee" ? "active" : ""}
              >
                Employee
              </button>
            </div>
            {gridMode === "byJob" && clients && (
              <div className="client-filter">
                <label>Client:</label>
                <select
                  value={selectedClientFilter ?? ""}
                  onChange={(e) => setSelectedClientFilter(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">All Clients</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {gridMode === "byEmployee" && jobs && (
              <>
                <div className="client-filter">
                  <label>Job:</label>
                  <select
                    value={selectedJobFilter ?? ""}
                    onChange={(e) => {
                      setSelectedJobFilter(e.target.value ? Number(e.target.value) : null);
                      if (!e.target.value) setShowAllTradies(false);
                    }}
                  >
                    <option value="">All Jobs</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.name} ({job.client.name})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedJobFilter && (
                  <label className="show-all-toggle">
                    <span className="toggle-label">Show all employees</span>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={showAllTradies}
                        onChange={(e) => setShowAllTradies(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                  </label>
                )}
              </>
            )}
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
                (() => {
                  // Filter tradies based on job selection
                  const filteredTradies = selectedJobFilter && !showAllTradies
                    ? gridData?.tradies.filter((tradie) =>
                        tradie.allocations.some((a) => a.jobId === selectedJobFilter)
                      )
                    : gridData?.tradies;
                  
                  return filteredTradies?.map((tradie) => (
                  <tr key={tradie.id}>
                    <td className="row-label">{tradie.user.name}</td>
                    {getPeriods().map(({ date, period }) => {
                      const alloc = findAllocation(tradie.id, date, period);
                      const showAlloc = alloc && (selectedJobFilter === null || alloc.jobId === selectedJobFilter);
                      return (
                        <td key={`${date.toISOString()}-${period}`} className={`schedule-cell period-${period.toLowerCase()}`}>
                          {showAlloc ? (
                            <div className={`allocation-cell allocation-${period.toLowerCase()}`}>
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
                          ) : !alloc ? (
                            <button
                              className="empty-cell-add"
                              onClick={() => setAllocationSlot({
                                date: date.toISOString().split("T")[0],
                                period,
                                tradePersonId: tradie.id,
                              })}
                              title="Add allocation"
                            >
                              +
                            </button>
                          ) : (
                            <div className="allocation-cell allocation-filtered">
                              <div className="filtered-indicator">—</div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ));
                })()
              ) : (
                // Job-centric view (new)
                (() => {
                  const filteredJobs = jobs?.filter((job) => 
                    selectedClientFilter === null || job.clientId === selectedClientFilter
                  ) || [];
                  return filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="row-label">
                        <div className="job-label">
                          <button
                            className="job-title-link"
                            onClick={() => setEditingJob(job)}
                          >
                            <strong>{job.name}</strong>
                          </button>
                          <div className="client-label">{job.client.name}</div>
                          <div className="job-requirements">
                            {job.requirements.map((r) => {
                              const filled = r.filledSlots ?? 0;
                              const badgeClass = filled > r.requiredSlots
                                ? "requirement-badge overfilled"
                                : filled === r.requiredSlots
                                  ? "requirement-badge filled"
                                  : "requirement-badge";
                              return (
                                <span key={r.id} className={badgeClass}>
                                  {r.tradeRole.name}: {filled}/{r.requiredSlots}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                      {getPeriods().map(({ date, period }) => {
                        const allocations = findAllocationsByJob(job.id, date, period);
                        return (
                          <td key={`${date.toISOString()}-${period}`} className={`schedule-cell period-${period.toLowerCase()}`}>
                            <div className={`allocation-cell allocation-${period.toLowerCase()}`}>
                              {allocations.map((alloc) => (
                                <div key={alloc.id} className="employee-allocation">
                                  <div className="employee-info">
                                    <div className="employee-name">
                                      {(() => {
                                        const fullName = alloc.tradePerson?.user?.name || "Unknown";
                                        const nameParts = fullName.split(" ");
                                        const firstName = nameParts[0];
                                        const lastName = nameParts.slice(1).join(" ");
                                        return (
                                          <>
                                            <span className="first-name">{firstName}</span>
                                            {lastName && <span className="last-name">{lastName}</span>}
                                          </>
                                        );
                                      })()}
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
                              <button
                                className="add-more-btn"
                                onClick={() => {
                                  setSelectedRoleFilters([]);
                                  setAllocationSlot({
                                    date: date.toISOString().split("T")[0],
                                    period,
                                    jobId: job.id,
                                  });
                                }}
                                title="Add tradie"
                              >
                                +
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} style={{ textAlign: "center", padding: "2rem" }}>
                      {selectedClientFilter ? "No jobs found for this client." : "No jobs found. Please create jobs first."}
                    </td>
                  </tr>
                );
                })()
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
              {getPeriods().map(({ date, period }) => {
                const dateStr = date.toISOString().split("T")[0];
                const alloc = ganttData.allocations.find(
                  (a) => a.date.split("T")[0] === dateStr && a.period === period
                );
                const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                const dateDisplay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                
                return (
                  <div key={`${dateStr}-${period}`} className={`gantt-item gantt-item-${period.toLowerCase()} ${alloc ? "" : "gantt-item-empty"}`}>
                    <div className="gantt-date">
                      <span className="gantt-day">{dayName}</span>
                      <span className="gantt-date-text">{dateDisplay}</span>
                      <span className={`gantt-period gantt-period-${period.toLowerCase()}`}>{period}</span>
                    </div>
                    {alloc ? (
                      <>
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
                      </>
                    ) : (
                      <div className="gantt-empty">Available</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: mySchedule } = useQuery({
    queryKey: ["mySchedule"],
    queryFn: () => api.schedule.mySchedule(),
    enabled: user?.role === "TradePerson",
  });

  const { data: jobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.jobs.list(),
    enabled: user?.role === "SystemAdmin" || user?.role === "OfficeStaff",
  });

  const { data: tradies } = useQuery({
    queryKey: ["tradies"],
    queryFn: () => api.tradies.list(),
    enabled: user?.role === "SystemAdmin" || user?.role === "OfficeStaff",
  });

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name}!</p>

      {user?.role === "TradePerson" && (
        <div className="dashboard-section">
          <h2>My Schedule (This Week)</h2>
          {mySchedule && mySchedule.allocations.length > 0 ? (
            <div className="schedule-list">
              {mySchedule.allocations.map((alloc) => (
                <div key={alloc.id} className="schedule-item">
                  <strong>
                    {new Date(alloc.date).toLocaleDateString()} {alloc.period}
                  </strong>
                  <div>
                    {alloc.job.name} - {alloc.job.client.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No allocations this week</p>
          )}
        </div>
      )}

      {(user?.role === "SystemAdmin" || user?.role === "OfficeStaff") && (
        <>
          <div className="dashboard-section">
            <h2>Quick Stats</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{jobs?.length || 0}</div>
                <div className="stat-label">Active Jobs</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{tradies?.length || 0}</div>
                <div className="stat-label">Trade People</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}




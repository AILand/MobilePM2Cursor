import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Layout.css";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const canManageUsers = user?.role === "SystemAdmin";
  const canManageClients = user?.role === "SystemAdmin" || user?.role === "OfficeStaff";
  const canManageTradies = user?.role === "SystemAdmin" || user?.role === "OfficeStaff";
  const canManageJobs = user?.role === "SystemAdmin" || user?.role === "OfficeStaff";

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">TradieDr</div>
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          {canManageUsers && <Link to="/users">Users</Link>}
          {canManageClients && <Link to="/clients">Clients</Link>}
          {canManageTradies && <Link to="/tradies">Tradies</Link>}
          {canManageJobs && <Link to="/jobs">Jobs</Link>}
          <Link to="/schedule">Schedule</Link>
          <span className="nav-user">{user?.name} ({user?.role})</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}




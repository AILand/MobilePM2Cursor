import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Layout.css";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  const canManageUsers = user?.role === "SystemAdmin";
  const canManageClients = user?.role === "SystemAdmin" || user?.role === "OfficeStaff";
  const canManageTradies = user?.role === "SystemAdmin" || user?.role === "OfficeStaff";
  const canManageJobs = user?.role === "SystemAdmin" || user?.role === "OfficeStaff";

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">TradieDr</div>
        <button 
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/dashboard" onClick={closeMenu} className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
          {canManageUsers && <Link to="/users" onClick={closeMenu} className={location.pathname === '/users' ? 'active' : ''}>Users</Link>}
          {canManageClients && <Link to="/clients" onClick={closeMenu} className={location.pathname === '/clients' ? 'active' : ''}>Clients</Link>}
          {canManageTradies && <Link to="/tradies" onClick={closeMenu} className={location.pathname === '/tradies' ? 'active' : ''}>Tradies</Link>}
          {canManageJobs && <Link to="/jobs" onClick={closeMenu} className={location.pathname === '/jobs' ? 'active' : ''}>Jobs</Link>}
          <Link to="/schedule" onClick={closeMenu} className={location.pathname === '/schedule' ? 'active' : ''}>Schedule</Link>
          <div className="nav-user-section">
            <span className="nav-user">{user?.name} <span className="nav-role">({user?.role})</span></span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
        {menuOpen && <div className="nav-overlay" onClick={closeMenu}></div>}
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}




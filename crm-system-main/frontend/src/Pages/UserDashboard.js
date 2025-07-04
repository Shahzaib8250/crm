// src/SuperAdminDashboard.js
import React from 'react';
import { useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { getUserInfo, logout } from '../services/authService';
import './UserDashboard.css';
import SubuserTickets from './SubuserTickets';
import SubuserProducts from './SubuserProducts';
import SubuserProfile from './SubuserProfile';
import SubuserNotifications from './SubuserNotifications';

const TicketsModule = () => (
  <div className="subuser-module-card">
    <h2>Tickets</h2>
    <p>View and manage your support tickets here. (Module coming soon!)</p>
  </div>
);

const ProductsModule = () => (
  <div className="subuser-module-card">
    <h2>Products</h2>
    <p>Browse and manage your assigned products here. (Module coming soon!)</p>
  </div>
);

const WelcomeModule = ({ user }) => (
  <section className="subuser-welcome-card">
    <h2>Welcome, {user?.profile?.fullName || 'User'}!</h2>
    <p>
      This is your personalized dashboard. Here you can view your profile, tasks, and notifications. If you need help, contact your enterprise admin.
    </p>
    <div className="subuser-info-grid">
      <div className="info-item">
        <span className="info-label">User ID</span>
        <span className="info-value">{user?.id}</span>
      </div>
      <div className="info-item">
        <span className="info-label">Email</span>
        <span className="info-value">{user?.email}</span>
      </div>
      <div className="info-item">
        <span className="info-label">Role</span>
        <span className="info-value">{user?.role}</span>
      </div>
    </div>
  </section>
);

const UserDashboard = () => {
  const navigate = useNavigate();
  const user = getUserInfo();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/subuser/login');
  };

  // Render WelcomeModule for /user root route
  const isRoot = location.pathname === '/user' || location.pathname === '/user/';

  return (
    <div className="subuser-dashboard-root">
      <aside className="subuser-sidebar">
        <div className="sidebar-logo">{user?.enterprise?.companyName || 'MOAQA'}</div>
        <nav className="sidebar-nav">
          <NavLink to="/user" end className={({ isActive }) => isActive ? 'active' : ''}><span className="icon">🏠</span> Dashboard</NavLink>
          <NavLink to="/user/tickets" className={({ isActive }) => isActive ? 'active' : ''}><span className="icon">🎫</span> Tickets</NavLink>
          <NavLink to="/user/products" className={({ isActive }) => isActive ? 'active' : ''}><span className="icon">🛒</span> Products</NavLink>
          <NavLink to="/user/profile" className={({ isActive }) => isActive ? 'active' : ''}><span className="icon">👤</span> Profile</NavLink>
          <NavLink to="/user/notifications" className={({ isActive }) => isActive ? 'active' : ''}><span className="icon">🔔</span> Notifications</NavLink>
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}>Logout</button>
      </aside>
      <main className="subuser-main">
        <header className="subuser-topbar">
          <div className="topbar-title">Subuser Dashboard</div>
          <div className="topbar-user">
            <span className="user-icon">👤</span>
            <span className="user-email">{user?.email}</span>
          </div>
        </header>
        {isRoot ? <WelcomeModule user={user} /> : <Outlet />}
      </main>
    </div>
  );
};

UserDashboard.WelcomeModule = WelcomeModule;
export default UserDashboard;

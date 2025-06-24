import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../Components/Layout/AdminSidebar';
import ThemeToggle from '../../Components/ThemeToggle';
import axios from 'axios';
import './CRM.css';
import { useNotification } from '../../utils/NotificationContext';

const CRMDashboard = () => {
  const [branding, setBranding] = useState({ logo: '', companyName: '', colors: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const navigate = useNavigate();
  const { notifications } = useNotification();

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/branding`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBranding(res.data);
      } catch (err) {
        setError('Failed to load branding info');
      } finally {
        setLoading(false);
      }
    };
    fetchBranding();
  }, []);

  // Apply branding colors to document root
  useEffect(() => {
    if (branding.colors) {
      Object.entries(branding.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value);
      });
    }
  }, [branding.colors]);

  if (loading) return <div className="loading-container">Loading CRM Dashboard...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="crm-dashboard-root">
      <aside className={`crm-sidebar${showSidebar ? '' : ' collapsed'}`}>
        <div className="crm-branding">
          {branding.logo && <img src={branding.logo} alt="Logo" className="crm-logo" />}
          <span className="crm-company-name">{branding.companyName}</span>
        </div>
        <nav className="crm-nav">
          <NavLink to="products" className={({ isActive }) => isActive ? 'active' : ''}>Products</NavLink>
          <NavLink to="leads" className={({ isActive }) => isActive ? 'active' : ''}>Leads</NavLink>
          <NavLink to="users" className={({ isActive }) => isActive ? 'active' : ''}>Users & Roles</NavLink>
          <NavLink to="audit-logs" className={({ isActive }) => isActive ? 'active' : ''}>Audit Logs</NavLink>
        </nav>
        <ThemeToggle />
      </aside>
      <main className="crm-main-content">
        {/* In-app notifications */}
        <div className="crm-notifications">
          {notifications.map((n) => (
            <div key={n.id} className={`crm-notification ${n.type}`}>{n.message}</div>
          ))}
        </div>
        {/* Topbar */}
        <header className="crm-topbar">
          <button className="sidebar-toggle" onClick={() => setShowSidebar(s => !s)}>
            {showSidebar ? '☰' : '☰'}
          </button>
          <span className="crm-dashboard-title">CRM Dashboard</span>
        </header>
        {/* Animated module transitions (placeholder) */}
        <div className="crm-module-content animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CRMDashboard; 
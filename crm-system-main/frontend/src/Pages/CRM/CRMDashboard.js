import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../Components/Layout/AdminSidebar';
import ThemeToggle from '../../Components/ThemeToggle';
import axios from 'axios';
import './CRM.css';
import { useNotification } from '../../utils/NotificationContext';

const moduleBlocks = [
  [
    { label: 'Products', route: 'products', icon: '📦' },
    { label: 'Services', route: 'services', icon: '🛠️' },
  ],
  [
    { label: 'Quotations', route: 'quotations', icon: '💼' },
    { label: 'Invoices', route: 'invoices', icon: '🧾' },
  ],
  [
    { label: 'Reports & Analytics', route: 'reports', icon: '📊' },
    { label: 'Complaints/Help', route: 'complaints', icon: '❓' },
  ],
  [
    { label: 'Customers', route: 'customers', icon: '👥' },
    { label: 'Sales', route: 'sales', icon: '💰' },
  ],
];

const sidebarLinks = [
  { label: 'Dashboard', route: '.', icon: '🏠' },
  { label: 'Products', route: 'products', icon: '📦' },
  { label: 'Services', route: 'services', icon: '🛠️' },
  { label: 'Leads', route: 'leads', icon: '📋' },
  { label: 'Quotations', route: 'quotations', icon: '💼' },
  { label: 'Invoices', route: 'invoices', icon: '🧾' },
  { label: 'Reports', route: 'reports', icon: '📊' },
  { label: 'Create Ticket', route: 'create-ticket', icon: '🎫' },
  { label: 'Users', route: 'users', icon: '👤' },
  { label: 'Customers', route: 'customers', icon: '👥' },
  { label: 'Sales', route: 'sales', icon: '💰' },
];

const CRMDashboard = () => {
  const [branding, setBranding] = useState({ logo: '', companyName: '', colors: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  useEffect(() => {
    if (branding.colors) {
      Object.entries(branding.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value);
      });
    }
  }, [branding.colors]);

  if (loading) return <div className="loading-container">Loading CRM Dashboard...</div>;
  if (error) return <div className="error-container">{error}</div>;

  // Show dashboard stats if at root (no sub-route)
  const isDashboardRoot = window.location.pathname.endsWith('/crm') || window.location.pathname.endsWith('/crm/');

  return (
    <div className="crm-pro-root">
      {/* Header */}
      <header className="crm-pro-header">
        <div className="crm-pro-header-left">
          {branding.logo ? (
            <img src={branding.logo} alt="Logo" className="crm-pro-logo" />
          ) : (
            <span className="crm-pro-logo-placeholder">🌀</span>
          )}
          <span className="crm-pro-company">{branding.companyName || 'Enterprise Name'}</span>
        </div>
        <div className="crm-pro-header-center">CRM Dashboard</div>
        <div className="crm-pro-header-right">
        <ThemeToggle />
          <span className="crm-pro-header-bell" title="Notifications">🔔</span>
          <span className="crm-pro-header-profile" title="Profile">👤</span>
        </div>
      </header>
      <div className="crm-pro-main">
        {/* Sidebar */}
        <aside className={`crm-pro-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>  
          <button className="crm-pro-sidebar-toggle" onClick={() => setSidebarCollapsed(v => !v)} title="Toggle Sidebar">
            {sidebarCollapsed ? '➡️' : '⬅️'}
          </button>
          <nav>
            {sidebarLinks.map(link => (
              <NavLink
                key={link.label}
                to={link.route}
                className={({ isActive }) => isActive ? 'crm-pro-sidebar-link active' : 'crm-pro-sidebar-link'}
                end={link.route === '.'}
                title={link.label}
              >
                <span className="crm-pro-sidebar-icon">{link.icon}</span>
                {!sidebarCollapsed && <span>{link.label}</span>}
              </NavLink>
            ))}
          </nav>
        </aside>
        {/* Main Content */}
        <main className="crm-pro-content">
          {isDashboardRoot ? (
            <div className="crm-pro-grid">
              {moduleBlocks.map((row, i) => (
                <div className="crm-pro-row" key={i}>
                  {row.map(block => (
                    <div
                      key={block.label}
                      className="crm-pro-block"
                      onClick={() => navigate(block.route)}
                      tabIndex={0}
                      role="button"
                      title={block.label}
                    >
                      <span className="crm-pro-block-icon">{block.icon}</span>
                      <span className="crm-pro-block-label">{block.label}</span>
              </div>
                  ))}
              </div>
              ))}
              </div>
          ) : (
            <Outlet />
          )}
        </main>
        {/* Notifications */}
        <aside className="crm-pro-notifications">
          <div className="crm-pro-notifications-title">Notifications</div>
          <div className="crm-pro-notifications-list">
            {notifications && notifications.length > 0 ? (
              notifications.map((n, idx) => (
                <div className="crm-pro-notification-card" key={idx}>
                  <span className="crm-pro-notification-icon">🔔</span>
                  <div className="crm-pro-notification-content">
                    <div className="crm-pro-notification-msg">{n.message}</div>
                    <div className="crm-pro-notification-time">{n.time || ''}</div>
              </div>
            </div>
              ))
            ) : (
              <div className="crm-pro-no-notifications">No notifications</div>
        )}
          </div>
        </aside>
        </div>
    </div>
  );
};

export default CRMDashboard; 
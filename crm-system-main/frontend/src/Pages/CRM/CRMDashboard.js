import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../Components/Layout/AdminSidebar';
import ThemeToggle from '../../Components/ThemeToggle';
import axios from 'axios';
import './CRM.css';
import { useNotification } from '../../utils/NotificationContext';
import { getUserInfo, logout } from '../../services/authService';

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
    { label: 'Reports', route: 'reports', icon: '📊' },
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
  const user = getUserInfo();
  const [profileDropdownVisible, setProfileDropdownVisible] = useState(false);
  const profileRef = React.useRef();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownVisible(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          <span className="crm-pro-company">
            {branding.companyName || 'Enterprise Name'}
            {user && user.profile && user.profile.fullName ? ` | ${user.profile.fullName}` : ''}
          </span>
        </div>
        <div className="crm-pro-header-center">CRM Dashboard</div>
        <div className="crm-pro-header-right">
        <ThemeToggle />
          <span className="crm-pro-header-bell" title="Notifications">🔔</span>
          <span
            className="crm-pro-header-profile"
            title="Profile"
            onClick={() => setProfileDropdownVisible((v) => !v)}
            ref={profileRef}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            👤
            {profileDropdownVisible && (
              <div className="crm-pro-profile-dropdown" style={{ position: 'absolute', right: 0, top: '120%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', borderRadius: 8, minWidth: 200, zIndex: 100 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
                  <div style={{ fontWeight: 600 }}>{user?.profile?.fullName || 'User'}</div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{user?.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{ width: '100%', padding: '12px 0', border: 'none', background: 'none', color: '#d32f2f', fontWeight: 600, cursor: 'pointer', borderTop: '1px solid #eee', borderRadius: '0 0 8px 8px' }}
                >
                  Logout
                </button>
              </div>
            )}
          </span>
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
                to={link.route === '.' ? '.' : `/crm/${link.route}`}
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
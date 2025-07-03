import React, { useState } from 'react';
import './UserDashboard.css';

const initialNotifications = [
  { id: 1, type: 'info', message: 'Welcome to your dashboard!', date: '2024-06-01' },
  { id: 2, type: 'success', message: 'Your ticket was resolved.', date: '2024-06-02' },
  { id: 3, type: 'warning', message: 'Password will expire soon.', date: '2024-06-03' },
];

const SubuserNotifications = () => {
  const [notifications] = useState(initialNotifications);
  return (
    <div className="subuser-module-card">
      <h2>Notifications</h2>
      <div className="notifications-list">
        {notifications.length === 0 ? <div>No notifications.</div> : notifications.map(n => (
          <div key={n.id} className={`notification-item ${n.type}`}>
            <div className="notification-message">{n.message}</div>
            <div className="notification-meta">{n.type.toUpperCase()} | {n.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubuserNotifications; 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CRM.css';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ action: '', user: '' });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user info from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(tokenData);
      } catch (err) {
        setCurrentUser(null);
      }
    }
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${baseUrl}/users/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log =>
    (!filter.action || log.action.includes(filter.action)) &&
    (!filter.user || (log.userId && log.userId.includes(filter.user)))
  );

  const exportCSV = () => {
    const csvRows = [
      ['Action', 'User', 'Target', 'Details', 'Timestamp'],
      ...filteredLogs.map(log => [
        log.action,
        log.userId,
        log.target,
        JSON.stringify(log.details),
        new Date(log.createdAt).toLocaleString()
      ])
    ];
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return <div className="crm-audit-log animate-fade-in"><div className="error">Only admins can view audit logs.</div></div>;
  }

  return (
    <div className="crm-audit-log animate-fade-in">
      <div className="crm-header">
        <h2>Audit Logs</h2>
        <div className="crm-actions">
          <input
            className="search-input"
            placeholder="Filter by action..."
            value={filter.action}
            onChange={e => setFilter(f => ({ ...f, action: e.target.value }))}
          />
          <input
            className="search-input"
            placeholder="Filter by user ID..."
            value={filter.user}
            onChange={e => setFilter(f => ({ ...f, user: e.target.value }))}
          />
          <button className="add-btn" onClick={exportCSV}>Export CSV</button>
        </div>
      </div>
      {loading ? (
        <div className="loading">Loading audit logs...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="audit-log-table-container">
          <table className="audit-log-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>User</th>
                <th>Target</th>
                <th>Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr><td colSpan="5">No logs found.</td></tr>
              ) : (
                filteredLogs.map((log, i) => (
                  <tr key={i}>
                    <td>{log.action}</td>
                    <td>{log.userId}</td>
                    <td>{log.target}</td>
                    <td><pre style={{ maxWidth: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(log.details, null, 2)}</pre></td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLog; 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CRM.css';
import { useNotification } from '../../utils/NotificationContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const UserRoleManagement = () => {
  const { addNotification } = useNotification();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    permissions: '{}', // JSON string
  });
  const [creating, setCreating] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/users/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(res.data);
    } catch (err) {
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async e => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      let permissions;
      try {
        permissions = JSON.parse(form.permissions);
      } catch {
        addNotification('Permissions must be valid JSON', 'error');
        setCreating(false);
        return;
      }
      await axios.post(`${API_URL}/api/users/roles`, {
        name: form.name,
        description: form.description,
        permissions,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      addNotification('Role created successfully', 'success');
      setForm({ name: '', description: '', permissions: '{}' });
      fetchRoles();
    } catch (err) {
      addNotification('Failed to create role', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="crm-role-management animate-fade-in">
      <h2>Role Management</h2>
      <form className="role-form" onSubmit={handleCreate}>
        <div className="form-group">
          <label>Role Name *</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <input name="description" value={form.description} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Permissions (JSON)</label>
          <textarea name="permissions" value={form.permissions} onChange={handleChange} rows={4} />
          <small>Example: {`{"products":{"view":true,"add":true}}`}</small>
        </div>
        <button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Role'}</button>
      </form>
      <hr />
      <h3>Existing Roles</h3>
      {loading ? <div>Loading...</div> : error ? <div className="error-message">{error}</div> : (
        <ul className="role-list">
          {roles.length === 0 ? <li>No roles found.</li> : roles.map(role => (
            <li key={role._id}><b>{role.name}</b> - {role.description}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserRoleManagement; 
import React, { useState, useEffect } from 'react';
import { getUserInfo } from '../services/authService';
import { getCurrentUserProfile, updateCurrentUserProfile } from '../services/api';
import './UserDashboard.css';

const SubuserProfile = () => {
  const user = getUserInfo();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getCurrentUserProfile(user.id);
        setProfile(response.data);
        setForm({
          fullName: response.data.profile?.fullName || '',
          phone: response.data.profile?.phone || ''
        });
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchProfile();
  }, [user?.id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleEdit = () => setEdit(true);
  const handleCancel = () => setEdit(false);
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateCurrentUserProfile(user.id, { profile: { ...profile.profile, ...form } });
      setProfile(prev => ({ ...prev, profile: { ...prev.profile, ...form } }));
      setEdit(false);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="subuser-module-card">Loading profile...</div>;
  if (error) return <div className="subuser-module-card" style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="subuser-module-card">
      <h2>Profile</h2>
      <div className="profile-info-grid">
        <div><b>Email:</b> {profile?.email}</div>
        <div><b>User ID:</b> {profile?._id}</div>
        <div><b>Role:</b> {profile?.role}</div>
      </div>
      <hr style={{ margin: '24px 0' }} />
      {edit ? (
        <form onSubmit={handleSave} className="profile-form">
          <div className="form-group">
            <label>Full Name</label>
            <input name="fullName" value={form.fullName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <button type="submit" className="ticket-submit-btn">Save</button>
          <button type="button" className="ticket-submit-btn" style={{ background: '#888', marginLeft: 12 }} onClick={handleCancel}>Cancel</button>
        </form>
      ) : (
        <div style={{ marginTop: 16 }}>
          <div><b>Full Name:</b> {profile?.profile?.fullName || <span style={{ color: '#aaa' }}>Not set</span>}</div>
          <div><b>Phone:</b> {profile?.profile?.phone || <span style={{ color: '#aaa' }}>Not set</span>}</div>
          <button className="ticket-submit-btn" style={{ marginTop: 18 }} onClick={handleEdit}>Edit Profile</button>
        </div>
      )}
      {success && <div style={{ color: 'green', marginTop: 12 }}>{success}</div>}
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
    </div>
  );
};

export default SubuserProfile; 
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CRM.css';
import { useNotification } from '../../utils/NotificationContext';
import { getUserInfo } from '../../services/authService';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'lead', label: 'Lead' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'customer', label: 'Customer' }
];
const SOURCE_OPTIONS = [
  { value: 'direct', label: 'Direct' },
  { value: 'referral', label: 'Referral' },
  { value: 'web', label: 'Web' },
  { value: 'social', label: 'Social' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' }
];

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  },
  status: 'new',
  source: 'direct',
  notes: ''
};

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const { addNotification } = useNotification();

  const fetchCustomers = async () => {
    console.log('Fetching customers');
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${baseUrl}/api/enterprise/crm/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(res.data);
    } catch (err) {
      setError('Failed to load customers');
        setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      fetchCustomers();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (form.address && typeof form.address === 'object' && name in form.address) {
      setForm(prev => ({ ...prev, address: { ...prev.address, [name]: value } }));
      } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const user = getUserInfo();
      // Clean address: only include non-empty fields
      const cleanedAddress = {};
      Object.entries(form.address).forEach(([key, value]) => {
        if (value && value.trim() !== '') cleanedAddress[key] = value;
      });
      // Build payload
      const payload = {
        ...form,
        address: cleanedAddress,
        assignedTo: user?.id
      };
      console.log('Submitting customer:', payload);
      await axios.post(`${baseUrl}/api/enterprise/crm/leads`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification('Customer added successfully', 'success');
      setShowModal(false);
      setForm(initialForm);
      fetchCustomers();
    } catch (err) {
      console.log('Add customer error:', err.response?.data);
      const errorData = err.response?.data;
      let errorMsg = errorData?.message || 'Failed to add customer';
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorMsg += ': ' + errorData.errors.join(', ');
      }
      addNotification(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="crm-module-page animate-fade-in">
          <h2>Customer Management</h2>
      <button className="add-btn" onClick={() => setShowModal(true)} style={{ marginBottom: 16 }}>Add Customer</button>
      {loading ? (
        <div className="loading-container">Loading customers...</div>
      ) : error ? (
        <div className="error-container">{error}</div>
      ) : customers.length === 0 ? (
        <div className="no-data-container">No customers found.</div>
      ) : (
            <div className="customers-grid">
          {customers.filter(c => c.status === 'customer').map(c => (
            <div className="customer-card" key={c._id}>
                    <div className="customer-header">
                <h3>{c.company || `${c.firstName} ${c.lastName}`}</h3>
                <span className={`status-badge ${c.status}`}>{c.status}</span>
                    </div>
                    <div className="customer-info">
                <p><b>Name:</b> {c.firstName} {c.lastName}</p>
                <p><b>Email:</b> {c.email}</p>
                <p><b>Phone:</b> {c.phone}</p>
                <p><b>Source:</b> {c.source}</p>
                <p><b>Notes:</b> {c.notes}</p>
                  </div>
            </div>
          ))}
            </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ minWidth: 400, maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Customer</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form className="customer-form" onSubmit={handleAddCustomer} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="form-group">
                  <label>First Name *</label>
                  <input name="firstName" value={form.firstName} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                  <label>Last Name *</label>
                  <input name="lastName" value={form.lastName} onChange={handleFormChange} required />
                  </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input name="email" type="email" value={form.email} onChange={handleFormChange} required />
                </div>
                  <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" value={form.phone} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                  <label>Company</label>
                  <input name="company" value={form.company} onChange={handleFormChange} />
                  </div>
                <div className="form-group">
                  <label>Street</label>
                  <input name="street" value={form.address.street} onChange={handleFormChange} />
                </div>
                  <div className="form-group">
                  <label>City</label>
                  <input name="city" value={form.address.city} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                  <label>State</label>
                  <input name="state" value={form.address.state} onChange={handleFormChange} />
                  </div>
                <div className="form-group">
                  <label>Zip Code</label>
                  <input name="zipCode" value={form.address.zipCode} onChange={handleFormChange} />
                </div>
                  <div className="form-group">
                  <label>Country</label>
                  <input name="country" value={form.address.country} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleFormChange}>
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Source</label>
                  <select name="source" value={form.source} onChange={handleFormChange}>
                    {SOURCE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea name="notes" value={form.notes} onChange={handleFormChange} rows={2} />
                </div>
                <div className="form-actions responsive-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                  <button type="submit" className="submit-btn primary" disabled={submitting}>{submitting ? 'Adding...' : 'Add Customer'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement; 
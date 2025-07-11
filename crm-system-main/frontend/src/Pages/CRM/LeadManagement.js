import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CRM.css';

const LeadManagement = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    status: 'lead',
    assignedTo: '',
    notes: '',
    source: '',
    potentialValue: 0,
    conversionProbability: 'medium'
  });
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [currentUser, setCurrentUser] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Show alert message with auto-dismiss
  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' });
    }, 3000);
  }, []);

  // Fetch admin users
  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      // Only superadmin should fetch all admins
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      if (tokenData.role !== 'superadmin') {
        setAdmins([]);
        return;
      }
      const response = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/users/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      setAlerts([...alerts, { type: 'error', message: 'Failed to fetch admins. Please try again.' }]);
    }
  };

  // Fetch leads (customers with status='lead')
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${baseUrl}/api/enterprise/crm/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setError('Failed to fetch leads. Please try again.');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchAdmins();
    
    // Get current user info
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(tokenData);
        
        // If admin, set assignedTo to current user's ID
        if (tokenData.role === 'admin') {
          setFormData(prev => ({ ...prev, assignedTo: tokenData.id }));
        }
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      // Ensure status is set to 'lead'
      const leadData = { ...formData, status: 'lead' };
      // Set assignedTo if not provided
      if (!leadData.assignedTo && currentUser?.role === 'admin') {
        leadData.assignedTo = currentUser.id;
      }
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const url = selectedLead
        ? `${baseUrl}/api/enterprise/crm/leads/${selectedLead._id}`
        : `${baseUrl}/api/enterprise/crm/leads`;
      const method = selectedLead ? 'put' : 'post';
      await axios[method](url, leadData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      showAlert(`Lead ${selectedLead ? 'updated' : 'created'} successfully`, 'success');
      setOpenDialog(false);
      resetForm();
      fetchLeads();
    } catch (error) {
      console.error('Error submitting lead:', error);
      setAlerts([...alerts, { 
        type: 'error', 
        message: `Failed to ${selectedLead ? 'update' : 'create'} lead: ${error.response?.data?.message || error.message}` 
      }]);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.delete(`${baseUrl}/api/enterprise/crm/leads/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showAlert('Lead deleted successfully', 'success');
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      setAlerts([...alerts, { 
        type: 'error', 
        message: `Failed to delete lead: ${error.response?.data?.message || error.message}` 
      }]);
    }
  };

  const handleConvertToCustomer = async (lead) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      // Ask if a deal should be created
      const createDeal = window.confirm('Do you want to create a deal for this customer?');
      
      let dealData = {};
      if (createDeal) {
        const dealTitle = window.prompt('Enter deal title:', `Deal with ${lead.name}`);
        if (!dealTitle) return; // User cancelled
        
        const dealValue = window.prompt('Enter deal value:', lead.potentialValue || '0');
        
        dealData = {
          createDeal: true,
          dealTitle,
          dealValue: parseFloat(dealValue) || lead.potentialValue || 0
        };
      }
      
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.post(
        `${baseUrl}/api/enterprise/crm/leads/${lead._id}/convert`,
        dealData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showAlert('Lead successfully converted to customer', 'success');
      fetchLeads();
    } catch (error) {
      console.error('Error converting lead:', error);
      setAlerts([...alerts, { 
        type: 'error', 
        message: `Failed to convert lead: ${error.response?.data?.message || error.message}` 
      }]);
    }
  };
  
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      status: 'lead',
      assignedTo: currentUser?.role === 'admin' ? currentUser.id : '',
      notes: '',
      source: '',
      potentialValue: 0,
      conversionProbability: 'medium'
    });
    setSelectedLead(null);
  };

  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setFormData({
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      status: 'lead', // Always keep as lead in this component
      assignedTo: lead.assignedTo || (currentUser?.role === 'admin' ? currentUser.id : ''),
      notes: lead.notes || '',
      source: lead.source || '',
      potentialValue: lead.potentialValue || 0,
      conversionProbability: lead.conversionProbability || 'medium'
    });
    setOpenDialog(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="crm-lead-management animate-fade-in">
      {alert.show && (
        <div className={`alert ${alert.type}`}>
          {alert.message}
        </div>
      )}
      
      {alerts.length > 0 && (
        <div className="alerts-container">
          {alerts.map((alert, index) => (
            <div key={index} className={`alert ${alert.type}`}>
              {alert.message}
              <button 
                className="alert-close"
                onClick={() => setAlerts(alerts.filter((_, i) => i !== index))}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="crm-header">
        <h2>Lead Management</h2>
        <button
          className="add-btn"
          onClick={() => {
            resetForm();
            setOpenDialog(true);
          }}
        >
          Add New Lead
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading leads...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="leads-grid">
          {leads.length === 0 ? (
            <div className="no-leads">No leads found. Add your first lead!</div>
          ) : (
            leads.map(lead => (
              <div key={lead._id} className="lead-card">
                <div className="lead-info">
                  <h3>{lead.name}</h3>
                  <p>{lead.email}</p>
                  <p>{lead.phone || 'No phone'}</p>
                  <p>{lead.company || 'No company'}</p>
                  <p className="source">{lead.source ? `Source: ${lead.source}` : 'No source'}</p>
                  <p className="probability">
                    Probability: 
                    <span className={`probability-${lead.conversionProbability || 'medium'}`}>
                      {lead.conversionProbability || 'Medium'}
                    </span>
                  </p>
                  <p className="value">Potential Value: ${lead.potentialValue || 0}</p>
                </div>
                <div className="lead-actions">
                  <button onClick={() => handleEdit(lead)}>Edit</button>
                  <button onClick={() => handleConvertToCustomer(lead)} className="convert-btn">Convert</button>
                  <button onClick={() => handleDelete(lead._id)} className="delete-btn">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {openDialog && (
        <div className="modal-overlay">
          <div className="modal" style={{ minHeight: '750px', maxHeight: '95vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{selectedLead ? 'Edit Lead' : 'Add New Lead'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setOpenDialog(false);
                  resetForm();
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="lead-form lead-form-modern">
                <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: 0 }}>
                  <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                    <label htmlFor="firstName">First Name <span className="required">*</span></label>
                    <div className="input-icon-group">
                      <span className="input-icon">👤</span>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        placeholder="Lead's first name"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <small className="helper-text">Enter the lead's first name.</small>
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                    <label htmlFor="lastName">Last Name <span className="required">*</span></label>
                    <div className="input-icon-group">
                      <span className="input-icon">👤</span>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        placeholder="Lead's last name"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <small className="helper-text">Enter the lead's last name.</small>
                  </div>
                </div>
                <div className="form-row">
                <div className="form-group">
                    <label htmlFor="email">Email <span className="required">*</span></label>
                    <div className="input-icon-group">
                      <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                        placeholder="lead@email.com"
                  />
                    </div>
                    <small className="helper-text">We'll never share the lead's email.</small>
                  </div>
                </div>
                <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                    <div className="input-icon-group">
                      <span className="input-icon">📞</span>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                        placeholder="e.g. +1 555 123 4567"
                  />
                </div>
                  </div>
                <div className="form-group">
                  <label htmlFor="company">Company</label>
                    <div className="input-icon-group">
                      <span className="input-icon">🏢</span>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                        placeholder="Company name"
                  />
                    </div>
                  </div>
                </div>
                <div className="form-row">
                <div className="form-group">
                  <label htmlFor="source">Lead Source</label>
                  <select
                    id="source"
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                  >
                    <option value="">Select Source</option>
                    <option value="direct">Direct</option>
                    <option value="referral">Referral</option>
                    <option value="web">Website</option>
                    <option value="social">Social Media</option>
                    <option value="event">Event</option>
                    <option value="other">Other</option>
                  </select>
                    <small className="helper-text">Where did this lead come from?</small>
                </div>
                <div className="form-group">
                  <label htmlFor="potentialValue">Potential Value ($)</label>
                    <div className="input-icon-group">
                      <span className="input-icon">💰</span>
                  <input
                    type="number"
                    id="potentialValue"
                    name="potentialValue"
                    value={formData.potentialValue}
                    onChange={handleChange}
                    min="0"
                    step="100"
                        placeholder="0"
                  />
                </div>
                    <small className="helper-text">Estimated deal value.</small>
                  </div>
                <div className="form-group">
                  <label htmlFor="conversionProbability">Conversion Probability</label>
                  <select
                    id="conversionProbability"
                    name="conversionProbability"
                    value={formData.conversionProbability}
                    onChange={handleChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    rows="3"
                      placeholder="Add any extra notes about this lead..."
                  />
                  </div>
                </div>
                <div className="form-actions responsive-actions">
                  <button type="button" className="cancel-btn" onClick={() => { setOpenDialog(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="submit-btn primary">{selectedLead ? 'Update Lead' : 'Add Lead'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManagement; 
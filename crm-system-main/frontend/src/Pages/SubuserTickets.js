import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getUserInfo } from '../services/authService';
import './UserDashboard.css';
import Modal from 'react-modal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SubuserTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ 
    subject: '', 
    description: '', 
    category: '',
    priority: 'Low'
  });
  const [submitting, setSubmitting] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [manageFormData, setManageFormData] = useState({ status: '', message: '' });

  const currentUser = getUserInfo();

  useEffect(() => {
    // Defensive: Check for token before fetching tickets
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You are not logged in. Please log in to view your tickets.');
      setLoading(false);
      return;
    }
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not logged in. Please log in to view your tickets.');
        setLoading(false);
        return;
      }
      // Debug: Log current user ID
      console.log('Fetching tickets for user ID:', currentUser?.id);
      const response = await axios.get(`${API_URL}/api/tickets/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      if (err.response && err.response.status === 401) {
        setError('Session expired or unauthorized. Please log in again.');
      } else {
        setError('Failed to load tickets');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (ticket) => {
    console.log('[SubuserTickets] handleOpenModal called with:', ticket);
    if (ticket.isAdminTicket) {
      alert("You can't manage your own created tickets.");
      return;
    }
    setSelectedTicket(ticket);
    setManageFormData({ status: ticket.status, message: '' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    console.log('[SubuserTickets] handleCloseModal called');
    setShowModal(false);
    setSelectedTicket(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.description || !form.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You are not logged in. Please log in to submit a ticket.');
        setSubmitting(false);
        return;
      }
      // Debug: Log current user ID
      console.log('Creating ticket for user ID:', currentUser?.id);
      await axios.post(`${API_URL}/api/tickets`, {
        name: currentUser?.profile?.fullName || 'Unknown',
        email: currentUser?.email || 'unknown@example.com',
        subject: form.subject,
        department: currentUser?.profile?.department || 'General',
        relatedTo: form.category,
        message: form.description,
        priority: form.priority,
        category: form.category,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reset form and refresh tickets
      setForm({ subject: '', description: '', category: '', priority: 'Low' });
      setShowCreateForm(false);
      fetchTickets(); // Always refresh after creation
      alert('Ticket submitted successfully!');
    } catch (err) {
      console.error('Error submitting ticket:', err);
      if (err.response && err.response.status === 401) {
        alert('Session expired or unauthorized. Please log in again.');
      } else {
        alert(err.response?.data?.message || 'Failed to submit ticket');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleManagementFormChange = (e) => {
    setManageFormData({ ...manageFormData, [e.target.name]: e.target.value });
  };

  const handleSubmitManagementForm = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/tickets/${selectedTicket._id}`, {
        status: manageFormData.status,
        message: manageFormData.message,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      setSelectedTicket(null);
      setManageFormData({ status: '', message: '' });
      fetchTickets();
      alert('Ticket updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update ticket');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="subuser-module-card">
      {/* Debug log for modal and selectedTicket state */}
      {console.log('[SubuserTickets] Render: showModal:', showModal, 'selectedTicket:', selectedTicket)}
      <h2>My Support Tickets</h2>
      
      {/* Create New Ticket Button */}
      <button 
        className="ticket-submit-btn" 
        onClick={() => setShowCreateForm(true)}
        style={{ marginBottom: '20px' }}
      >
        Create New Ticket
      </button>

      {/* Create Ticket Form */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Ticket</h3>
              <button className="close-btn" onClick={() => setShowCreateForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Subject *</label>
                  <input 
                    name="subject" 
                    value={form.subject} 
                    onChange={handleChange} 
                    placeholder="Brief description of your issue" 
                    className="ticket-input" 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Category *</label>
                  <select 
                    name="category" 
                    value={form.category} 
                    onChange={handleChange} 
                    className="ticket-input" 
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Technical">Technical Issue</option>
                    <option value="Billing">Billing Issue</option>
                    <option value="Product">Product</option>
                    <option value="Service">Service</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Priority</label>
                  <select 
                    name="priority" 
                    value={form.priority} 
                    onChange={handleChange} 
                    className="ticket-input"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Description *</label>
                  <textarea 
                    name="description" 
                    value={form.description} 
                    onChange={handleChange} 
                    placeholder="Please describe your issue in detail" 
                    className="ticket-textarea" 
                    required 
                    rows="5"
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="ticket-submit-btn" 
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tickets List */}
      <h4>My Tickets</h4>
      {loading ? (
        <div>Loading tickets...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : tickets.length === 0 ? (
        <div>No tickets found. Create your first ticket above.</div>
      ) : (
        <div className="tickets-list">
          {tickets.map(ticket => (
            <div key={ticket._id} className="ticket-item" onClick={() => handleOpenModal(ticket)}>
              <div className="ticket-subject">{ticket.subject}</div>
              <div className="ticket-meta">
                Status: <b>{ticket.status}</b> | 
                Priority: <b>{ticket.priority}</b> | 
                Created: {new Date(ticket.createdAt).toLocaleDateString()}
              </div>
              {ticket.responses && ticket.responses.length > 0 && (
                <div className="ticket-responses">
                  {ticket.responses.length} response{ticket.responses.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={showModal && selectedTicket && !selectedTicket.isAdminTicket}
        onRequestClose={handleCloseModal}
        contentLabel="Manage Ticket"
        className="Modal"
        overlayClassName="Overlay"
      >
        {selectedTicket && !selectedTicket.isAdminTicket && (
          <div className="modal-content">
            <h3>Manage Ticket: {selectedTicket.subject}</h3>
            <p><strong>Ticket No:</strong> {selectedTicket.ticketNo || 'TKT-000'}</p>
            <p><strong>Status:</strong> {selectedTicket.status}</p>
            <p><strong>Priority:</strong> {selectedTicket.priority}</p>
            <p><strong>Created By:</strong> {selectedTicket.name}</p>
            <hr/>
            <form onSubmit={handleSubmitManagementForm}>
              <div className="form-group">
                <label htmlFor="status">Update Status:</label>
                <select
                  id="status"
                  name="status"
                  value={manageFormData.status || selectedTicket.status}
                  onChange={handleManagementFormChange}
                  className="form-control"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="message">Add Response:</label>
                <textarea
                  id="message"
                  name="message"
                  value={manageFormData.message}
                  onChange={handleManagementFormChange}
                  placeholder="Type your response here..."
                  rows="4"
                  className="form-control"
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SubuserTickets; 
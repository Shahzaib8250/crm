import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import './TicketDetailsModal.css';
import websocketService from '../../../services/websocketService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TicketDetailsModal = ({ isOpen, onClose, ticket, userRole, onResponseAdded, onForwardTicket, canManage = true, mode = 'view', setModalAlert }) => {
  console.log('[TicketDetailsModal] Rendered with:', { isOpen, ticket, userRole, canManage, mode });
  const [newResponse, setNewResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [currentResponses, setCurrentResponses] = useState([]);
  const [status, setStatus] = useState(ticket && ticket.status ? ticket.status : 'Open');

  useEffect(() => {
    if (isOpen && ticket) {
      console.log('TicketDetailsModal received userRole:', userRole);
      // Sort responses by creation time to show them in chronological order
      const sortedResponses = [...(ticket.responses || [])].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      setCurrentResponses(sortedResponses);
      setStatus(ticket.status); // Sync status with ticket when modal opens
    }
  }, [isOpen, ticket, userRole]);

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!newResponse.trim()) {
      showAlert('Response cannot be empty!', 'error');
      return;
    }

    if (!ticket || !ticket._id) {
      showAlert('Ticket ID is missing. Cannot submit response.', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Submitting response for ticket ID:', ticket._id);
      
      // Validate and sanitize the response message
      const sanitizedMessage = newResponse.trim();
      if (!sanitizedMessage) {
        showAlert('Response cannot be empty!', 'error');
        setLoading(false);
        return;
      }

      // Prepare the request data
      const requestData = {
        message: sanitizedMessage,
        status: ticket.status || 'Open',
        role: userRole
      };

      console.log('Sending request with data:', requestData);
      
      // Use PUT to update the ticket with a new response
      const response = await axios.put(`${API_URL}/api/tickets/${ticket._id}`, 
        requestData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      if (response.data) {
        // Sort responses by creation time
        const updatedResponses = [...(response.data.responses || [])].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        setCurrentResponses(updatedResponses);
        setNewResponse('');
        showAlert('Response sent successfully!', 'success');
        
        // Emit WebSocket event for ticket update
        if (response.data) {
          try {
            websocketService.notifyEnterpriseAdmins('ticket_updated', response.data);
            if (ticket.submittedBy && ticket.submittedBy._id) {
              websocketService.notifyUser(ticket.submittedBy._id, 'ticket_updated_for_user', response.data);
            }
          } catch (wsError) {
            console.error('WebSocket notification error:', wsError);
            // Don't show error to user for WebSocket issues
          }
        }
        
        if (onResponseAdded) {
          onResponseAdded(); // Callback to refresh tickets in parent component
        }
      }
    } catch (error) {
      console.error('Error submitting response:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        ticketId: ticket._id,
        userRole: userRole
      });
      
      let errorMessage = 'Failed to send response.';
      
      if (error.response) {
        const serverError = error.response.data;
        errorMessage = serverError?.message || serverError?.error || 'Server error occurred. Please try again.';
        
        if (error.response.status === 500) {
          errorMessage = 'Server error occurred. Please try again later.';
          console.error('Server error details:', serverError);
        } else if (error.response.status === 404) {
          errorMessage = 'Ticket not found. Please refresh the page and try again.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to respond to this ticket.';
        } else if (error.response.status === 400) {
          errorMessage = serverError?.message || 'Invalid request. Please check your input and try again.';
        }
      } else if (error.request) {
        errorMessage = 'No response received from server. Please check your connection and try again.';
        console.error('No response received:', error.request);
      }
      
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/tickets/${ticket._id}/status`, {
        status: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data && response.data.status === newStatus) {
        showAlert('Status updated successfully!', 'success');
        if (onResponseAdded) onResponseAdded();
      } else {
        showAlert('Failed to update status.', 'error');
      }
    } catch (error) {
      showAlert('Error updating status.', 'error');
      console.error('Status update error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add setModalAlert to props
  const handleForwardToSuperAdmin = async (ticket) => {
    if (!onForwardTicket) return;
    try {
      await onForwardTicket(ticket, (msg, type = 'success') => {
        setAlert({ show: true, message: msg, type });
        if (setModalAlert) setModalAlert(msg, type);
        setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
      });
    } catch (err) {
      const msg = err?.message || 'Failed to forward ticket';
      setAlert({ show: true, message: msg, type: 'error' });
      if (setModalAlert) setModalAlert(msg, 'error');
      setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
    }
  };

  // Determine if editing should be disabled for admin
  const isSuperAdminTicket = ticket && (ticket.forwardedToSuperAdmin || ticket.isAdminTicket);
  const isAdmin = userRole === 'admin';
  const disableAdminEdit = isAdmin && isSuperAdminTicket;

  // Chat bubble color classes by role
  const getChatBubbleClass = (role) => {
    switch (role) {
      case 'admin':
        return 'chat-bubble-admin';
      case 'superadmin':
        return 'chat-bubble-superadmin';
      case 'user':
      default:
        return 'chat-bubble-user';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Ticket Details"
      className="ticket-details-modal"
      overlayClassName="modal-backdrop"
      ariaHideApp={false}
    >
      <div className="modal-header">
        <h2>{mode === 'manage' ? 'Manage Ticket' : 'Ticket Details'}</h2>
        <button className="close-btn" onClick={onClose}>×</button>
        </div>
      <div className="modal-body">
        {alert.show && (
          <div className={`alert alert-${alert.type}`} style={{ marginBottom: 12 }}>
            {alert.message}
          </div>
        )}
        {/* Fallback if ticket is null or undefined */}
        {!ticket ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
            No ticket selected or ticket data unavailable.
          </div>
        ) : (
          mode === 'manage' && canManage && !disableAdminEdit ? (
            <form className="manage-form-section" onSubmit={handleSubmitResponse}>
              <div className="form-group">
                <label><strong>Title:</strong></label>
                <input type="text" value={ticket.subject || ''} readOnly disabled />
          </div>
              <div className="form-group">
                <label><strong>Description:</strong></label>
                <textarea value={ticket.message || ticket.description || ''} readOnly disabled rows={3} />
          </div>
              <div className="form-group">
                <label><strong>Status:</strong></label>
                <select
                  value={status}
                  onChange={handleStatusChange}
                  disabled={!canManage || loading}
                >
                  <option value="Open">Open</option>
                  <option value="Working">Working</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
          </div>
              <div className="form-group">
                <label><strong>Add Response:</strong></label>
                <textarea
                  value={newResponse}
                  onChange={e => setNewResponse(e.target.value)}
                  placeholder="Type your response..."
                  rows={4}
                  disabled={!canManage}
                />
          </div>
              <button type="submit" className="submit-response-btn" disabled={loading || !canManage}>
                {loading ? 'Sending...' : 'Send Response'}
              </button>
              {/* Forward to Super Admin button logic */}
              {userRole === 'admin' && !ticket.isAdminTicket && !ticket.forwardedToSuperAdmin && canManage && (
            <button 
                  type="button"
                  className="forward-superadmin-btn"
                  style={{ marginTop: 12, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => handleForwardToSuperAdmin(ticket)}
                  disabled={loading}
            >
              Forward to Super Admin
            </button>
              )}
              <div className="responses-list">
                <h3>Conversation</h3>
                {currentResponses.length > 0 ? (
                  currentResponses.map((response, index) => (
                    <div key={index} className="response-item">
                      <div className="response-header">
                        <span className="response-role">{response.role}</span>
                        <span className="response-time">{new Date(response.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="response-message">{response.message}</p>
          </div>
                  ))
                ) : (
                  <p className="no-responses">No messages yet. Start the conversation!</p>
                )}
              </div>
            </form>
          ) : mode === 'manage' && canManage && disableAdminEdit ? (
            <div className="ticket-details-section">
              <div className="manage-warning" style={{ color: 'red', marginBottom: 12 }}>
                This ticket has been submitted to Super Admin. Admins can no longer edit or respond to this ticket.
              </div>
              <p><strong>Subject:</strong> {ticket.subject || ''}</p>
              <p><strong>Description:</strong> {ticket.message || ticket.description || ''}</p>
              <p><strong>Status:</strong> {ticket.status || ''}</p>
              <p><strong>Priority:</strong> {ticket.priority || ''}</p>
              <div className="responses-list chat-interface">
          <h3>Conversation</h3>
            {currentResponses.length > 0 ? (
                  currentResponses.map((response, index) => (
                    <div key={index} className={`response-item ${getChatBubbleClass(response.role)}`}> 
                  <div className="response-header">
                        <span className="response-role">{response.role}</span>
                        <span className="response-time">{new Date(response.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="response-message">{response.message}</p>
                </div>
                  ))
            ) : (
              <p className="no-responses">No messages yet. Start the conversation!</p>
            )}
          </div>
        </div>
          ) : mode === 'view' && !disableAdminEdit ? (
            <div className="ticket-details-section">
              <p><strong>Subject:</strong> {ticket.subject || ''}</p>
              <p><strong>Description:</strong> {ticket.message || ticket.description || ''}</p>
              <p><strong>Status:</strong> {ticket.status || ''}</p>
              <p><strong>Priority:</strong> {ticket.priority || ''}</p>
              <div className="responses-list chat-interface">
                <h3>Conversation</h3>
                {currentResponses.length > 0 ? (
                  currentResponses.map((response, index) => (
                    <div key={index} className={`response-item ${getChatBubbleClass(response.role)}`}> 
                      <div className="response-header">
                        <span className="response-role">{response.role}</span>
                        <span className="response-time">{new Date(response.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="response-message">{response.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="no-responses">No messages yet. Start the conversation!</p>
                )}
              </div>
              <form className="add-response-form" onSubmit={handleSubmitResponse} style={{marginTop: 16}}>
                <div className="form-group">
                  <label><strong>Add Response:</strong></label>
          <textarea
            value={newResponse}
                    onChange={e => setNewResponse(e.target.value)}
                    placeholder="Type your response..."
                    rows={3}
                    disabled={loading}
          />
                </div>
                <button type="submit" className="submit-response-btn" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Response'}
          </button>
        </form>
            </div>
          ) : (
            <div className="ticket-details-section">
              <p><strong>Subject:</strong> {ticket.subject || ''}</p>
              <p><strong>Description:</strong> {ticket.message || ticket.description || ''}</p>
              <p><strong>Status:</strong> {ticket.status || ''}</p>
              <p><strong>Priority:</strong> {ticket.priority || ''}</p>
              <div className="responses-list chat-interface">
                <h3>Conversation</h3>
                {currentResponses.length > 0 ? (
                  currentResponses.map((response, index) => (
                    <div key={index} className={`response-item ${getChatBubbleClass(response.role)}`}> 
                      <div className="response-header">
                        <span className="response-role">{response.role}</span>
                        <span className="response-time">{new Date(response.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="response-message">{response.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="no-responses">No messages yet. Start the conversation!</p>
                )}
              </div>
            </div>
          )
        )}
      </div>
      {/* Optionally, show a warning if in manage mode but cannot manage */}
      {mode === 'manage' && !canManage && (
        <div className="manage-warning" style={{ color: 'red', marginTop: 10 }}>
          You do not have permission to manage this ticket.
        </div>
      )}
    </Modal>
  );
};

export default TicketDetailsModal; 
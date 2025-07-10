import React from 'react';
import './TicketList.css';
import { getUserInfo } from '../../../services/authService';

const TicketList = ({ tickets, onSelectTicket, onManageTicket, onDeleteTicket, onViewTicket, loading, error, userRole }) => {
  console.log('[TicketList] props:', { onManageTicket });
  const userInfo = getUserInfo();
  const currentUserId = userInfo?._id || userInfo?.id;

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get priority color class
  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'Critical':
        return 'priority-critical';
      case 'High': 
        return 'priority-high';
      case 'Medium':
        return 'priority-medium';
      case 'Low':
      default:
        return 'priority-low';
    }
  };

  // Get status color class
  const getStatusClass = (status) => {
    switch(status) {
      case 'Open':
        return 'status-open';
      case 'In Progress': 
        return 'status-progress';
      case 'Resolved':
        return 'status-resolved';
      case 'Closed':
      default:
        return 'status-closed';
    }
  };

  if (loading) {
    return (
      <div className="ticket-list">
        <div className="loading">Loading tickets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-list">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="ticket-list">
      <div className="ticket-list-header">
        <div className="ticket-header-item ticket-id">Ticket No</div>
        <div className="ticket-header-item ticket-subject">Subject</div>
        <div className="ticket-header-item ticket-priority">Priority</div>
        <div className="ticket-header-item ticket-status">Status</div>
        <div className="ticket-header-item ticket-date">Created On</div>
        <div className="ticket-header-item ticket-assigned">Assigned To</div>
        <div className="ticket-header-item ticket-enterprise">Enterprise</div>
        <div className="ticket-header-item ticket-actions">Actions</div>
      </div>
      
      {tickets.length === 0 ? (
        <div className="no-tickets">
          <p>No tickets found.</p>
          <p className="no-tickets-sub">Create a new ticket to get started.</p>
        </div>
      ) : (
        <div className="ticket-list-body">
          {tickets.map(ticket => {
            // Debug: Log adminId, currentUserId, and check result
            const adminIdValue = ticket.adminId?._id || ticket.adminId;
            const canManage = userRole === 'superadmin' || (userRole === 'admin' && !ticket.isAdminTicket && ticket.adminId && String(adminIdValue) === String(currentUserId));
            console.log('[TicketList] Ticket:', ticket.ticketNo, 'adminId:', adminIdValue, 'currentUserId:', currentUserId, 'canManage:', canManage);

            // Determine creator name
            let creatorName = ticket.submittedBy?.profile?.fullName || ticket.name || 'Unknown';
            // Determine assigned to
            let assignedTo = 'Unassigned';
            if (ticket.isAdminTicket || ticket.forwardedToSuperAdmin) {
              assignedTo = 'Superadmin';
            } else if (ticket.adminId && ticket.adminId.profile && ticket.adminId.profile.fullName) {
              assignedTo = ticket.adminId.profile.fullName;
            }
            return (
            <div 
              key={ticket._id} 
              className="ticket-row"
              // onClick={() => onSelectTicket(ticket)} // Row click might interfere with button clicks
            >
              <div className="ticket-cell ticket-id">{ticket.ticketNo || 'TKT-000'}</div>
              <div className="ticket-cell ticket-subject">{ticket.subject}</div>
              <div className="ticket-cell ticket-priority">
                <span className={`priority-badge ${getPriorityClass(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
              <div className="ticket-cell ticket-status">
                <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
              <div className="ticket-cell ticket-date">{creatorName}</div>
              <div className="ticket-cell ticket-assigned">{assignedTo}</div>
              <div className="ticket-cell ticket-enterprise">
                {ticket.submittedBy?.enterprise?.companyName || 'N/A'}
              </div>
              <div className="ticket-cell ticket-actions">
                <button
                  className="view-ticket-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                      onViewTicket(ticket, 'view');
                  }}
                >
                  View
                </button>
                  <button
                    className="manage-ticket-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('[TicketList] Manage button clicked for ticket:', ticket);
                      console.log('[TicketList] onManageTicket:', onManageTicket);
                      if (typeof onManageTicket === 'function') {
                        onManageTicket(ticket, 'manage');
                      } else {
                        console.error('onManageTicket is not a function:', onManageTicket);
                      }
                    }}
                  >
                    Manage
                  </button>
                  {canManage && (
                <button 
                  className="delete-ticket-btn"
                  onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTicket(ticket);
                  }}
                >
                  Delete
                </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TicketList; 
import React, { useState } from 'react';
import './UserDashboard.css';

const initialTickets = [
  { id: '1', subject: 'Login Issue', status: 'Open', created: '2024-06-01', description: 'Cannot log in to my account.' },
  { id: '2', subject: 'Feature Request', status: 'Closed', created: '2024-05-28', description: 'Please add dark mode.' },
];

const SubuserTickets = () => {
  const [tickets, setTickets] = useState(initialTickets);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [form, setForm] = useState({ subject: '', description: '' });

  const handleOpenModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTicket(null);
  };
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject || !form.description) return;
    setTickets([
      { id: Date.now().toString(), subject: form.subject, status: 'Open', created: new Date().toISOString().slice(0, 10), description: form.description },
      ...tickets,
    ]);
    setForm({ subject: '', description: '' });
  };
  return (
    <div className="subuser-module-card">
      <h2>Tickets</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24, textAlign: 'left' }}>
        <h4>Create New Ticket</h4>
        <input name="subject" value={form.subject} onChange={handleChange} placeholder="Subject" className="ticket-input" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="ticket-textarea" required />
        <button type="submit" className="ticket-submit-btn">Submit Ticket</button>
      </form>
      <h4>My Tickets</h4>
      <div className="tickets-list">
        {tickets.length === 0 ? <div>No tickets found.</div> : tickets.map(ticket => (
          <div key={ticket.id} className="ticket-item" onClick={() => handleOpenModal(ticket)}>
            <div className="ticket-subject">{ticket.subject}</div>
            <div className="ticket-meta">Status: <b>{ticket.status}</b> | Created: {ticket.created}</div>
          </div>
        ))}
      </div>
      {showModal && selectedTicket && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedTicket.subject}</h3>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>
            <div className="modal-body">
              <p><b>Status:</b> {selectedTicket.status}</p>
              <p><b>Created:</b> {selectedTicket.created}</p>
              <p>{selectedTicket.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubuserTickets; 
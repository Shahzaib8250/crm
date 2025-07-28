import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CRM.css';
import { getUserInfo } from '../../services/authService';
import { useNotification } from '../../utils/NotificationContext';
import jsPDF from 'jspdf';

const QuotationManagement = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    serviceId: '',
    requestDetails: '',
    requestedPrice: '',
    customRequirements: '',
  });
  const [services, setServices] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const user = getUserInfo();
  const { addNotification } = useNotification();

  // Fetch quotations
  const fetchQuotations = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${baseUrl}/api/quotations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuotations(res.data);
    } catch (err) {
      setError('Failed to load quotations');
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch services for dropdown
  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const endpoint = user?.role === 'user' ? '/api/services/user' : '/api/services/admin';
      const res = await axios.get(`${baseUrl}${endpoint}?source=crm`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(res.data);
    } catch (err) {
      setServices([]);
    }
  };

  useEffect(() => {
    fetchQuotations();
    fetchServices();
    // eslint-disable-next-line
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddQuotation = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      if (!form.serviceId) throw new Error('Please select a service');
      if (!form.requestDetails) throw new Error('Request details are required');
      const service = services.find(s => s._id === form.serviceId);
      const payload = {
        serviceId: form.serviceId,
        requestDetails: form.requestDetails,
        requestedPrice: form.requestedPrice ? parseFloat(form.requestedPrice) : undefined,
        customRequirements: form.customRequirements,
        enterpriseDetails: {
          companyName: user?.enterprise?.companyName || '',
          contactPerson: user?.profile?.fullName || '',
          email: user?.email || '',
          phone: user?.profile?.phone || ''
        }
      };
      await axios.post(`${baseUrl}/api/quotations`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification('Quotation added successfully', 'success');
      setShowModal(false);
      setForm({ serviceId: '', requestDetails: '', requestedPrice: '', customRequirements: '' });
      fetchQuotations();
    } catch (err) {
      addNotification(err.response?.data?.message || err.message || 'Failed to add quotation', 'error');
    }
  };

  // Download PDF handler
  const handleDownloadQuotation = (quotation) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Quotation', 14, 18);
    doc.setFontSize(12);
    let y = 30;
    doc.text(`Service: ${quotation.serviceId?.name || 'N/A'}`, 14, y);
    y += 8;
    doc.text(`Request Details: ${quotation.requestDetails}`, 14, y);
    y += 8;
    doc.text(`Requested Price: ${quotation.requestedPrice ? `$${quotation.requestedPrice}` : '-'}`, 14, y);
    y += 8;
    doc.text(`Status: ${quotation.status}`, 14, y);
    y += 8;
    doc.text(`Custom Requirements: ${quotation.customRequirements || '-'}`, 14, y);
    y += 8;
    doc.text(`Enterprise: ${quotation.enterpriseDetails?.companyName || '-'}`, 14, y);
    y += 8;
    doc.text(`Contact Person: ${quotation.enterpriseDetails?.contactPerson || '-'}`, 14, y);
    y += 8;
    doc.text(`Email: ${quotation.enterpriseDetails?.email || '-'}`, 14, y);
    y += 8;
    doc.text(`Phone: ${quotation.enterpriseDetails?.phone || '-'}`, 14, y);
    y += 8;
    doc.text(`Created At: ${quotation.createdAt ? new Date(quotation.createdAt).toLocaleString() : '-'}`, 14, y);
    // Add more fields as needed
    doc.save(`Quotation_${quotation._id}.pdf`);
  };

  // Delete handler
  const handleDeleteQuotation = async (quotation) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.delete(`${baseUrl}/api/quotations/${quotation._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification('Quotation deleted successfully', 'success');
      setSelectedQuotation(null);
      fetchQuotations();
    } catch (err) {
      addNotification(err.response?.data?.message || err.message || 'Failed to delete quotation', 'error');
    }
  };

  return (
    <div className="crm-module-page animate-fade-in">
      <h2>Quotation Management</h2>
      <button className="add-btn" onClick={() => setShowModal(true)} style={{ marginBottom: 16 }}>Add Quotation</button>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ minWidth: 400, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Quotation</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form className="quotation-form" onSubmit={handleAddQuotation}>
                <div className="form-group">
                  <label>Service *</label>
                  <select name="serviceId" value={form.serviceId} onChange={handleFormChange} required>
                    <option value="">Select Service</option>
                    {services.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Request Details *</label>
                  <textarea name="requestDetails" value={form.requestDetails} onChange={handleFormChange} required rows={3} />
                </div>
                <div className="form-group">
                  <label>Requested Price</label>
                  <input type="number" name="requestedPrice" value={form.requestedPrice} onChange={handleFormChange} min={0} />
                </div>
                <div className="form-group">
                  <label>Custom Requirements</label>
                  <textarea name="customRequirements" value={form.customRequirements} onChange={handleFormChange} rows={2} />
                </div>
                <div className="form-actions responsive-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="submit-btn primary">Add Quotation</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {selectedQuotation && (
        <div className="modal-overlay" onClick={() => setSelectedQuotation(null)}>
          <div className="modal" style={{ minWidth: 400, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quotation Details</h3>
              <button className="close-btn" onClick={() => setSelectedQuotation(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="quotation-details">
                <div><b>Service:</b> {selectedQuotation.serviceId?.name || 'N/A'}</div>
                <div><b>Request Details:</b> {selectedQuotation.requestDetails}</div>
                <div><b>Requested Price:</b> {selectedQuotation.requestedPrice ? `$${selectedQuotation.requestedPrice}` : '-'}</div>
                <div><b>Status:</b> <span className={`status-badge status-${selectedQuotation.status}`}>{selectedQuotation.status}</span></div>
                <div><b>Custom Requirements:</b> {selectedQuotation.customRequirements || '-'}</div>
                <div><b>Enterprise:</b> {selectedQuotation.enterpriseDetails?.companyName || '-'}</div>
                <div><b>Contact Person:</b> {selectedQuotation.enterpriseDetails?.contactPerson || '-'}</div>
                <div><b>Email:</b> {selectedQuotation.enterpriseDetails?.email || '-'}</div>
                <div><b>Phone:</b> {selectedQuotation.enterpriseDetails?.phone || '-'}</div>
                <div><b>Created At:</b> {selectedQuotation.createdAt ? new Date(selectedQuotation.createdAt).toLocaleString() : '-'}</div>
                {/* Add more fields as needed */}
              </div>
              <button className="download-btn" style={{ marginTop: 16, marginRight: 8 }} onClick={() => handleDownloadQuotation(selectedQuotation)}>Download</button>
              <button className="delete-btn" style={{ marginTop: 16, background: '#d32f2f', color: '#fff' }} onClick={() => handleDeleteQuotation(selectedQuotation)}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div className="loading-container">Loading quotations...</div>
      ) : error ? (
        <div className="error-container">{error}</div>
      ) : quotations.length === 0 ? (
        <div className="no-data-container">No quotations found.</div>
      ) : (
        <div className="quotations-table-container">
          <table className="quotations-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Request Details</th>
                <th>Requested Price</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q._id}>
                  <td>{q.serviceId?.name || 'N/A'}</td>
                  <td>{q.requestDetails}</td>
                  <td>{q.requestedPrice ? `$${q.requestedPrice}` : '-'}</td>
                  <td><span className={`status-badge status-${q.status}`}>{q.status}</span></td>
                  <td>{q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <button className="view-btn" onClick={() => setSelectedQuotation(q)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QuotationManagement; 
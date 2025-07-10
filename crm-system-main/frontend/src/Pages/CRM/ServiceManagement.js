import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CRM.css';
import { useNotification } from '../../utils/NotificationContext';
import { getUserInfo } from '../../services/authService';

const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const CATEGORY_OPTIONS = [
    'IT', 'Marketing', 'Design', 'Consulting', 'Support', 'Training', 'Other'
  ];
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Other',
    icon: '',
    features: [],
    duration: { value: '', unit: 'one-time' }
  });
  const { addNotification } = useNotification();
  const user = getUserInfo();

  const fetchServices = async () => {
    try {
    setLoading(true);
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${baseUrl}/api/services/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Only show services created by admins (not superadmin)
      const filtered = response.data.filter(service => service.createdBy && typeof service.createdBy === 'object' && service.createdBy.role === 'admin');
      setServices(filtered);
      setError(null);
    } catch (err) {
      setError('Failed to fetch services');
      setServices([]);
      addNotification('Failed to fetch services', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      let payload = { ...formData };
      // Clean up duration
      if (!payload.duration.value) payload.duration = { unit: payload.duration.unit };
      // Ensure category is valid
      if (!CATEGORY_OPTIONS.includes(payload.category)) payload.category = 'Other';
      // Ensure price is a number
      payload.price = Number(payload.price);
      const url = selectedService
        ? `${baseUrl}/api/services/${selectedService._id}`
        : `${baseUrl}/api/services/admin`;
      const method = selectedService ? 'put' : 'post';
      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification(`Service ${selectedService ? 'updated' : 'created'} successfully`, 'success');
    setOpenDialog(false);
    setSelectedService(null);
      setFormData({ name: '', description: '', price: 0, category: 'Other', icon: '', features: [], duration: { value: '', unit: 'one-time' } });
      fetchServices();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save service';
      addNotification(`Failed to save service: ${msg}`, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.delete(`${baseUrl}/api/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    addNotification('Service deleted successfully', 'success');
      fetchServices();
    } catch (err) {
      addNotification('Failed to delete service', 'error');
    }
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      category: service.category || 'Other',
      icon: service.icon || '',
      features: service.features || [],
      duration: service.duration || { value: '', unit: 'one-time' }
    });
    setOpenDialog(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('duration.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({ ...prev, duration: { ...prev.duration, [key]: value } }));
    } else {
    setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="crm-product-management animate-fade-in">
      <div className="crm-header">
        <h2>Service Management</h2>
        <div className="crm-actions">
          <button className="add-btn" onClick={() => { setOpenDialog(true); setSelectedService(null); setFormData({ name: '', description: '', price: 0, category: 'Other', icon: '', features: [], duration: { value: '', unit: 'one-time' } }); }}>Add Service</button>
        </div>
      </div>
      {loading ? (
        <div className="loading">Loading services...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="products-grid">
          {services.length === 0 ? (
            <div className="no-products">No services found. Add your first service!</div>
          ) : (
            services.map(service => (
              <div key={service._id} className="product-card">
                <div className="product-info">
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  <p>Category: {service.category || 'N/A'}</p>
                  <p>Price: ${service.price || 0}</p>
                </div>
                <div className="product-actions">
                  <button onClick={() => handleEdit(service)}>Edit</button>
                  <button onClick={() => handleDelete(service._id)} className="delete-btn">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {openDialog && (
        <div className="modal-overlay">
          <div className="modal product-modal">
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {selectedService ? 'Edit Service' : 'Add New Service'}
                <span style={{ fontSize: '1.5rem' }}>{formData.icon || '🛠️'}</span>
              </h3>
              <button className="close-btn" onClick={() => setOpenDialog(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', paddingBottom: 0 }}>
              <form onSubmit={handleSubmit} className="product-form product-form-modern">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Name <span className="required">*</span></label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter service name" />
                    <small className="helper-text">Service name should be unique and descriptive.</small>
                  </div>
                <div className="form-group">
                    <label htmlFor="icon">Icon</label>
                    <div className="icon-picker">
                      <input type="text" id="icon" name="icon" value={formData.icon || ''} onChange={handleChange} maxLength={2} placeholder="e.g. 🛠️" style={{ width: '3rem', textAlign: 'center', fontSize: '1.5rem' }} />
                      <span className="icon-picker-list">
                        {["🛠️","🔧","💼","🧾","📊","❓","👥","💰","🖥️","📱","🛒","🎁","📚","📝","🔗"].map(ic => (
                          <button type="button" key={ic} className="icon-btn" onClick={() => setFormData(prev => ({ ...prev, icon: ic }))}>{ic}</button>
                        ))}
                      </span>
                    </div>
                    <small className="helper-text">Pick an emoji or icon for easy identification.</small>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label htmlFor="description">Description <span className="required">*</span></label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} required placeholder="Describe the service..." rows={3} />
                    <small className="helper-text">Briefly describe the service and its main features.</small>
                  </div>
                </div>
                <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select id="category" name="category" value={formData.category} onChange={handleChange}>
                    {CATEGORY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <small className="helper-text">Group similar services for easier management.</small>
                </div>
                <div className="form-group">
                  <label htmlFor="price">Price</label>
                    <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" placeholder="$0.00" />
                    <small className="helper-text">Set the base price (USD).</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="duration.value">Duration</label>
                    <input type="number" id="duration.value" name="duration.value" value={formData.duration.value || ''} onChange={handleChange} min="0" placeholder="e.g. 12" />
                    <select id="duration.unit" name="duration.unit" value={formData.duration.unit} onChange={handleChange}>
                      <option value="one-time">One-time</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                    <small className="helper-text">Specify duration if applicable.</small>
                  </div>
                </div>
                <div className="form-actions responsive-actions">
                  <button type="button" className="cancel-btn" onClick={() => setOpenDialog(false)}>Cancel</button>
                  <button type="submit" className="submit-btn primary">{selectedService ? 'Update Service' : 'Add Service'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement; 
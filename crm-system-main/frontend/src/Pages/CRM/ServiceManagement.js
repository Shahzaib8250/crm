import React, { useState, useEffect } from 'react';
import './CRM.css';
import { useNotification } from '../../utils/NotificationContext';

const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0
  });
  const { addNotification } = useNotification();

  // Placeholder fetch function
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setServices([
        { _id: '1', name: 'Consulting', description: 'Business consulting service', category: 'Business', price: 100 },
        { _id: '2', name: 'Support', description: 'Technical support', category: 'IT', price: 50 }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedService) {
      setServices(services.map(s => s._id === selectedService._id ? { ...selectedService, ...formData } : s));
      addNotification('Service updated successfully', 'success');
    } else {
      setServices([...services, { ...formData, _id: Date.now().toString() }]);
      addNotification('Service added successfully', 'success');
    }
    setOpenDialog(false);
    setSelectedService(null);
    setFormData({ name: '', description: '', category: '', price: 0 });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    setServices(services.filter(s => s._id !== id));
    addNotification('Service deleted successfully', 'success');
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      price: service.price
    });
    setOpenDialog(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="crm-product-management animate-fade-in">
      <div className="crm-header">
        <h2>Service Management</h2>
        <div className="crm-actions">
          <button className="add-btn" onClick={() => { setOpenDialog(true); setSelectedService(null); setFormData({ name: '', description: '', category: '', price: 0 }); }}>Add Service</button>
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
          <div className="modal">
            <div className="modal-header">
              <h3>{selectedService ? 'Edit Service' : 'Add New Service'}</h3>
              <button className="close-btn" onClick={() => setOpenDialog(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="product-form">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <input type="text" id="category" name="category" value={formData.category} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="price">Price</label>
                  <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" />
                </div>
                <button type="submit" className="submit-btn">{selectedService ? 'Update Service' : 'Add Service'}</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement; 
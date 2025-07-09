import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CRM.css';
import { useNotification } from '../../utils/NotificationContext';

const ProductManagement = () => {
  const [products, setProducts] = useState({ enterprise: [], superadmin: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'digital',
    category: '',
    price: 0
  });
  const { addNotification } = useNotification();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${baseUrl}/api/crm/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Support new backend response structure
      if (response.data.enterpriseProducts && response.data.superadminProducts) {
        setProducts({
          enterprise: response.data.enterpriseProducts,
          superadmin: response.data.superadminProducts
        });
      } else {
        // fallback for old response
        setProducts({ enterprise: response.data, superadmin: [] });
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch products');
      setProducts({ enterprise: [], superadmin: [] });
      addNotification('Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      let payload = { ...formData };
      if (!selectedProduct) {
        // Add a unique productId for new products
        payload.productId = 'crm-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      }
      const url = selectedProduct
        ? `${baseUrl}/api/crm/products/${selectedProduct._id}`
        : `${baseUrl}/api/crm/products`;
      const method = selectedProduct ? 'put' : 'post';
      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification(`Product ${selectedProduct ? 'updated' : 'created'} successfully`, 'success');
      setOpenDialog(false);
      setSelectedProduct(null);
      setFormData({ name: '', description: '', type: 'digital', category: '', price: 0 });
      fetchProducts();
    } catch (err) {
      addNotification('Failed to save product', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.delete(`${baseUrl}/api/crm/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification('Product deleted successfully', 'success');
      fetchProducts();
    } catch (err) {
      addNotification('Failed to delete product', 'error');
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      type: product.type || 'digital',
      category: product.category || '',
      price: product.price || 0
    });
    setOpenDialog(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredEnterpriseProducts = typeFilter === 'all'
    ? (products.enterprise || [])
    : (products.enterprise || []).filter(p => p.type === typeFilter);
  const filteredSuperadminProducts = typeFilter === 'all'
    ? (products.superadmin || [])
    : (products.superadmin || []).filter(p => p.type === typeFilter);

  return (
    <div className="crm-product-management animate-fade-in">
      <div className="crm-header">
        <h2>Product Management</h2>
        <div className="crm-actions">
          <select
            className="filter-select"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="digital">Digital</option>
            <option value="physical">Physical</option>
          </select>
          <button className="add-btn" onClick={() => { setOpenDialog(true); setSelectedProduct(null); setFormData({ name: '', description: '', type: 'digital', category: '', price: 0 }); }}>Add Product</button>
        </div>
      </div>
      {loading ? (
        <div className="loading">Loading products...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <h3>Your Products</h3>
          <div className="products-grid">
            {filteredEnterpriseProducts.length === 0 ? (
              <div className="no-products">No products found. Add your first product!</div>
            ) : (
              filteredEnterpriseProducts.map(product => (
                <div key={product._id} className="product-card">
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <p>Type: <b>{product.type}</b></p>
                    <p>Category: {product.category || 'N/A'}</p>
                    <p>Price: ${product.price || 0}</p>
                  </div>
                  <div className="product-actions">
                    <button onClick={() => handleEdit(product)}>Edit</button>
                    <button onClick={() => handleDelete(product._id)} className="delete-btn">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
      {openDialog && (
        <div className="modal-overlay">
          <div className="modal product-modal">
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {selectedProduct ? 'Edit Product' : 'Add New Product'}
                <span style={{ fontSize: '1.5rem' }}>{formData.icon || '📦'}</span>
              </h3>
              <button className="close-btn" onClick={() => setOpenDialog(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', paddingBottom: 0 }}>
              <form onSubmit={handleSubmit} className="product-form product-form-modern">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Name <span className="required">*</span></label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter product name" />
                    <small className="helper-text">Product name should be unique and descriptive.</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="icon">Icon</label>
                    <div className="icon-picker">
                      <input type="text" id="icon" name="icon" value={formData.icon || ''} onChange={handleChange} maxLength={2} placeholder="e.g. 📦" style={{ width: '3rem', textAlign: 'center', fontSize: '1.5rem' }} />
                      <span className="icon-picker-list">
                        {["📦","🛠️","💼","🧾","📊","❓","👥","💰","🖥️","📱","🛒","🎁","🔧","📚","📝","🔗"].map(ic => (
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
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} required placeholder="Describe the product..." rows={3} />
                    <small className="helper-text">Briefly describe the product and its main features.</small>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="type">Type</label>
                    <select id="type" name="type" value={formData.type} onChange={handleChange} required>
                      <option value="digital">Digital</option>
                      <option value="physical">Physical</option>
                    </select>
                    <small className="helper-text">Is this a digital or physical product?</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <input type="text" id="category" name="category" value={formData.category} onChange={handleChange} placeholder="e.g. CRM, HRM" />
                    <small className="helper-text">Group similar products for easier management.</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="price">Price</label>
                    <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" placeholder="$0.00" />
                    <small className="helper-text">Set the base price (USD).</small>
                  </div>
                </div>
                <div className="form-actions responsive-actions">
                  <button type="button" className="cancel-btn" onClick={() => setOpenDialog(false)}>Cancel</button>
                  <button type="submit" className="submit-btn primary">{selectedProduct ? 'Update Product' : 'Add Product'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement; 
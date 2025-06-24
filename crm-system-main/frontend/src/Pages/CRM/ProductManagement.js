import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CRM.css';
import { useNotification } from '../../utils/NotificationContext';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
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
      const response = await axios.get(`${baseUrl}/crm/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch products');
      setProducts([]);
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
      const url = selectedProduct
        ? `${baseUrl}/crm/products/${selectedProduct._id}`
        : `${baseUrl}/crm/products`;
      const method = selectedProduct ? 'put' : 'post';
      await axios[method](url, formData, {
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
      await axios.delete(`${baseUrl}/crm/products/${id}`, {
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

  const filteredProducts = typeFilter === 'all'
    ? products
    : products.filter(p => p.type === typeFilter);

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
        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <div className="no-products">No products found. Add your first product!</div>
          ) : (
            filteredProducts.map(product => (
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
                  {/* Placeholder for details modal */}
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
              <h3>{selectedProduct ? 'Edit Product' : 'Add New Product'}</h3>
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
                  <label htmlFor="type">Type</label>
                  <select id="type" name="type" value={formData.type} onChange={handleChange} required>
                    <option value="digital">Digital</option>
                    <option value="physical">Physical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <input type="text" id="category" name="category" value={formData.category} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="price">Price</label>
                  <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" />
                </div>
                <button type="submit" className="submit-btn">{selectedProduct ? 'Update Product' : 'Add Product'}</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement; 
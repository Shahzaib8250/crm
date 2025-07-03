import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';
import { fetchProducts } from '../services/api';

const getProductIcon = (name) => {
  switch ((name || '').toLowerCase()) {
    case 'crm': return '📊';
    case 'hrms': return '👥';
    case 'job portal': return '🔎';
    case 'job board': return '📋';
    case 'project management': return '📈';
    case 'analytics suite': return '📊';
    default: return '🛒';
  }
};

const SubuserProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetchProducts();
        setProducts(response.data || []);
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleOpenModal = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };
  const handleProductClick = (product) => {
    if ((product.name || '').toLowerCase().includes('crm')) {
      navigate('/crm');
    } else {
      handleOpenModal(product);
    }
  };

  return (
    <div className="subuser-module-card">
      <h2>Products</h2>
      <h4>My Products</h4>
      {loading ? (
        <div>Loading products...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <div className="products-grid">
          {products.length === 0 ? <div>No products found.</div> : products.map(product => (
            <div
              key={product._id || product.id}
              className="product-block"
              onClick={() => handleProductClick(product)}
              style={((product.name || '').toLowerCase().includes('crm')) ? { cursor: 'pointer', border: '2px solid #1976d2' } : {}}
            >
              <div className="product-block-header">
                <span className="product-block-icon">{getProductIcon(product.name)}</span>
                <span className={`product-status-badge ${product.active === false ? 'inactive' : 'active'}`}>{product.active === false ? 'Inactive' : 'Active'}</span>
              </div>
              <div className="product-block-name">{product.name}</div>
              <div className="product-block-type">{product.type || product.category}</div>
              <div className="product-block-desc">{product.description}</div>
            </div>
          ))}
        </div>
      )}
      {showModal && selectedProduct && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedProduct.name}</h3>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>
            <div className="modal-body">
              <p><b>Type:</b> {selectedProduct.type || selectedProduct.category}</p>
              <p><b>Status:</b> {selectedProduct.active === false ? 'Inactive' : 'Active'}</p>
              <p>{selectedProduct.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubuserProducts; 
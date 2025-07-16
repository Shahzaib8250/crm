import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CRM.css';
import { getUserInfo } from '../../services/authService';
import { useNotification } from '../../utils/NotificationContext';

const ITEM_TYPES = [
  { value: 'service', label: 'Service' },
  { value: 'product', label: 'Product' },
  { value: 'quotation', label: 'Quotation' }
];
const BILLING_PERIODS = [
  'one time', 'monthly', 'fortnight', 'yearly', '6 months', '3 months'
];

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    customerId: '',
    items: [{ type: 'service', itemId: '', name: '', description: '', quantity: 1, unitPrice: 0 }],
    dueDate: '',
    notes: '',
    billingPeriod: 'one time'
  });
  const user = getUserInfo();
  const { addNotification } = useNotification();

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('token');
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${baseUrl}/api/enterprise/crm/leads`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCustomers(res.data);
      } catch (err) {
        setCustomers([]);
      }
    };
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${baseUrl}/api/crm/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Use only enterprise products for this admin
        setProducts(res.data.enterpriseProducts || res.data);
      } catch (err) {
        setProducts([]);
      }
    };
    const fetchServices = async () => {
      try {
        const token = localStorage.getItem('token');
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${baseUrl}/api/services/admin`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setServices(res.data);
      } catch (err) {
        setServices([]);
      }
    };
    fetchCustomers();
    fetchProducts();
    fetchServices();
  }, [user?.id]);

  useEffect(() => {
    if (!user || !user.id) return; // Only fetch if user is loaded
    setLoading(true);
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem('token');
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        let url = '/api/invoices/admin';
        const response = await axios.get(`${baseUrl}${url}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Remove extra filtering for user role; backend already filters by enterprise
        setInvoices(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch invoices');
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [user?.id, user?.role]);

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedInvoice(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  const handleItemChange = (idx, field, value) => {
    setForm(prev => {
      const items = [...prev.items];
      if (field === 'itemId') {
        // When selecting a product/service, set both itemId and name
        const type = items[idx].type;
        let selected = null;
        if (type === 'product') {
          selected = products.find(p => p._id === value);
        } else if (type === 'service') {
          selected = services.find(s => s._id === value);
        }
        if (selected) {
          items[idx].itemId = selected._id;
          items[idx].name = selected.name;
          items[idx].unitPrice = selected.price || 0;
        } else {
          items[idx].itemId = value;
        }
      } else {
        items[idx][field] = value;
        if (field === 'quantity' || field === 'unitPrice') {
          items[idx].quantity = Number(items[idx].quantity) || 1;
          items[idx].unitPrice = Number(items[idx].unitPrice) || 0;
          items[idx].totalPrice = items[idx].quantity * items[idx].unitPrice;
        }
      }
      return { ...prev, items };
    });
  };
  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { type: 'service', itemId: '', name: '', description: '', quantity: 1, unitPrice: 0 }] }));
  const removeItem = (idx) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const customer = customers.find(c => c._id === form.customerId);
      if (!customer) throw new Error('Customer not found');
      const items = form.items.map(item => ({
        ...item,
        totalPrice: (item.quantity || 1) * (item.unitPrice || 0)
      }));
      // Validate all items have itemId
      if (items.some(i => !i.itemId)) throw new Error('All items must have a valid product/service selected.');
      const totalAmount = items.reduce((sum, i) => sum + (i.totalPrice || 0), 0);
      const payload = {
        adminId: user.id,
        enterpriseDetails: {
          companyName: customer.company || `${customer.firstName} ${customer.lastName}`,
          email: customer.email
        },
        items,
        totalAmount,
        dueDate: form.dueDate,
        notes: form.notes,
        billingPeriod: form.billingPeriod
      };
      console.log('Submitting invoice payload:', payload);
      await axios.post(`${baseUrl}/api/invoices`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification('Invoice generated successfully', 'success');
      setShowForm(false);
      setForm({ customerId: '', items: [{ type: 'service', itemId: '', name: '', description: '', quantity: 1, unitPrice: 0 }], dueDate: '', notes: '', billingPeriod: 'one time' });
      // Refresh invoice list
      setLoading(true);
      const res = await axios.get(`${baseUrl}/api/invoices/admin`, { headers: { Authorization: `Bearer ${token}` } });
      setInvoices(res.data);
      setLoading(false);
    } catch (err) {
      console.log('Invoice error:', err.response?.data);
      addNotification(err.message || 'Failed to generate invoice', 'error');
    }
  };

  return (
    <div className="crm-module-page animate-fade-in">
      <h2>Invoice Management</h2>
      {user?.role === 'admin' && (
        <button className="add-btn" onClick={() => setShowForm(true)} style={{ marginBottom: 16 }}>Generate Invoice</button>
      )}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal" style={{ minWidth: 400, maxWidth: 600 }}>
            <div className="modal-header">
              <h3>Generate Invoice</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleFormSubmit} className="invoice-form">
                <div className="form-group">
                  <label>Customer *</label>
                  <select name="customerId" value={form.customerId} onChange={handleFormChange} required>
                    <option value="">Select Customer</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.company || `${c.firstName} ${c.lastName}`} ({c.email})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date *</label>
                  <input type="date" name="dueDate" value={form.dueDate} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Billing Period</label>
                  <select name="billingPeriod" value={form.billingPeriod} onChange={handleFormChange}>
                    {BILLING_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea name="notes" value={form.notes} onChange={handleFormChange} rows={2} />
                </div>
                <div className="form-group">
                  <label>Items *</label>
                  {form.items.map((item, idx) => (
                    <div key={idx} className="invoice-item-row">
                      <select value={item.type} onChange={e => handleItemChange(idx, 'type', e.target.value)} style={{ width: 100 }}>
                        {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      {/* Product/Service selector */}
                      {item.type === 'product' && (
                        <select value={item.itemId} onChange={e => handleItemChange(idx, 'itemId', e.target.value)} style={{ width: 140 }} required>
                          <option value="">Select Product</option>
                          {products.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                          ))}
                        </select>
                      )}
                      {item.type === 'service' && (
                        <select value={item.itemId} onChange={e => handleItemChange(idx, 'itemId', e.target.value)} style={{ width: 140 }} required>
                          <option value="">Select Service</option>
                          {services.map(s => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                      )}
                      <input type="text" placeholder="Name" value={item.name} onChange={e => handleItemChange(idx, 'name', e.target.value)} required style={{ width: 120 }} />
                      <input type="text" placeholder="Description" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} style={{ width: 120 }} />
                      <input type="number" placeholder="Qty" min={1} value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} required style={{ width: 60 }} />
                      <input type="number" placeholder="Unit Price" min={0} value={item.unitPrice} onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)} required style={{ width: 90 }} />
                      <span style={{ margin: '0 8px' }}>= ${((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}</span>
                      <button type="button" onClick={() => removeItem(idx)} disabled={form.items.length === 1}>&times;</button>
                    </div>
                  ))}
                  <button type="button" className="add-btn" onClick={addItem} style={{ marginTop: 8 }}>+ Add Item</button>
                </div>
                <div className="form-actions responsive-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="submit-btn primary">Generate Invoice</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div className="loading">Loading invoices...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : invoices.length === 0 ? (
        <div className="no-data">No invoices found.</div>
      ) : (
        <div className="crm-invoice-table-container">
          <table className="crm-invoice-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv._id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '-'}</td>
                  <td><span className={`status-badge status-${inv.status}`}>{inv.status}</span></td>
                  <td>${inv.totalAmount?.toFixed(2) || '0.00'}</td>
                  <td>
                    <button className="view-btn" onClick={() => handleView(inv)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal" style={{ minWidth: 400, maxWidth: 600 }}>
            <div className="modal-header">
              <h3>Invoice #{selectedInvoice.invoiceNumber}</h3>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div><b>Date:</b> {selectedInvoice.issueDate ? new Date(selectedInvoice.issueDate).toLocaleDateString() : '-'}</div>
              <div><b>Status:</b> <span className={`status-badge status-${selectedInvoice.status}`}>{selectedInvoice.status}</span></div>
              <div><b>Total:</b> ${selectedInvoice.totalAmount?.toFixed(2) || '0.00'}</div>
              <div><b>Due Date:</b> {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : '-'}</div>
              <div><b>Notes:</b> {selectedInvoice.notes || '-'}</div>
              <hr />
              <b>Items:</b>
              <ul>
                {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                  selectedInvoice.items.map((item, idx) => (
                    <li key={idx}>{item.name || item.type} - ${item.totalPrice?.toFixed(2) || '0.00'}</li>
                  ))
                ) : (
                  <li>No items</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement; 
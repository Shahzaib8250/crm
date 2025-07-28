import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CRM.css';
import { getUserInfo } from '../../services/authService';
import { useNotification } from '../../utils/NotificationContext';
import jsPDF from 'jspdf';
// For modern jsPDF, autotable is a named import from 'jspdf-autotable'
import autoTable from 'jspdf-autotable';

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
  const [managingInvoiceId, setManagingInvoiceId] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
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
        const res = await axios.get(`${baseUrl}/api/services/admin?source=crm`, {
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

  const downloadInvoice = (invoice) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Invoice #${invoice.invoiceNumber || ''}`, 14, 18);
      doc.setFontSize(12);
      doc.text(`Date: ${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : '-'}`, 14, 28);
      doc.text(`Status: ${invoice.status}`, 14, 36);
      doc.text(`Total: $${invoice.totalAmount?.toFixed(2) || '0.00'}`, 14, 44);
      doc.text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}`, 14, 52);
      doc.text(`Notes: ${invoice.notes || '-'}`, 14, 60);
      doc.text(`Customer: ${invoice.enterpriseDetails?.companyName || ''}`, 14, 68);
      doc.text(`Email: ${invoice.enterpriseDetails?.email || ''}`, 14, 76);
      // Items Table
      const items = invoice.items?.map((item, idx) => [
        idx + 1,
        item.name || item.type,
        item.description || '',
        item.quantity || 1,
        `$${item.unitPrice?.toFixed(2) || '0.00'}`,
        `$${item.totalPrice?.toFixed(2) || '0.00'}`
      ]) || [];
      autoTable(doc, {
        head: [['#', 'Name', 'Description', 'Qty', 'Unit Price', 'Total']],
        body: items,
        startY: 84
      });
      doc.save(`Invoice_${invoice.invoiceNumber || invoice._id}.pdf`);
    } catch (err) {
      console.error('Invoice download error:', err);
      alert('Failed to download invoice. Please try again.');
    }
  };

  // Add this function to handle status update
  const handleStatusUpdate = async () => {
    if (!managingInvoiceId) return;
    setStatusUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      if (!['paid', 'cancelled'].includes(selectedStatus)) {
        addNotification('Only Paid or Cancelled status can be set.', 'error');
        setStatusUpdating(false);
        return;
      }
      const res = await axios.patch(
        `${baseUrl}/api/invoices/${managingInvoiceId}/status`,
        { status: selectedStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvoices(prev => prev.map(inv => inv._id === managingInvoiceId ? { ...inv, status: res.data.status } : inv));
      addNotification('Invoice status updated', 'success');
      setManagingInvoiceId(null);
      setSelectedStatus('');
    } catch (err) {
      // Log error for debugging
      console.error('Status update error:', err, err.response);
      let backendMsg = err.response?.data?.message || err.message || 'Failed to update status';
      addNotification(backendMsg, 'error');
    } finally {
      setStatusUpdating(false);
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
                    <button className="download-btn" onClick={() => downloadInvoice(inv)} style={{ marginLeft: 8 }}>Download</button>
                    <button
                      className="manage-btn"
                      style={{ marginLeft: 8 }}
                      onClick={() => {
                        setManagingInvoiceId(inv._id);
                        setSelectedStatus(inv.status);
                      }}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Manage Status Modal */}
      {managingInvoiceId && (
        <div className="modal-overlay">
          <div className="modal" style={{ minWidth: 320, maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Manage Invoice Status</h3>
              <button className="close-btn" onClick={() => { setManagingInvoiceId(null); setSelectedStatus(''); }}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <b>Current Status:</b> <span className={`status-badge status-${invoices.find(i => i._id === managingInvoiceId)?.status}`}>{invoices.find(i => i._id === managingInvoiceId)?.status}</span>
              </div>
              <div className="form-group">
                <label>Change Status</label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  disabled={statusUpdating}
                  style={{ width: '100%', marginBottom: 16 }}
                >
                  <option value="pending" disabled>Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-actions responsive-actions">
                <button className="cancel-btn" onClick={() => { setManagingInvoiceId(null); setSelectedStatus(''); }} disabled={statusUpdating}>Cancel</button>
                <button className="submit-btn primary" onClick={handleStatusUpdate} disabled={statusUpdating || selectedStatus === invoices.find(i => i._id === managingInvoiceId)?.status}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Debug info: show user and invoice admin IDs for troubleshooting */}
      {managingInvoiceId && (
        <div style={{ fontSize: '0.85em', color: '#888', marginBottom: 8 }}>
          <div>Current User ID: {user?.id}</div>
          <div>Invoice Admin ID: {invoices.find(i => i._id === managingInvoiceId)?.adminId}</div>
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
              <button className="download-btn" onClick={() => downloadInvoice(selectedInvoice)} style={{ marginTop: 16 }}>Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement; 
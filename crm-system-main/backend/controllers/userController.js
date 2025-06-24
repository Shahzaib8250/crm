const EnterpriseRole = require('../models/EnterpriseRole');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Create a new custom role
const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const enterpriseId = req.user.enterprise.enterpriseId;
    const createdBy = req.user._id;
    const role = await EnterpriseRole.create({ enterpriseId, name, description, permissions, createdBy });
    res.status(201).json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all roles for the enterprise
const getRoles = async (req, res) => {
  try {
    const enterpriseId = req.user.enterprise.enterpriseId;
    const roles = await EnterpriseRole.find({ enterpriseId });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a role
const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description, permissions } = req.body;
    const role = await EnterpriseRole.findByIdAndUpdate(roleId, { name, description, permissions }, { new: true });
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a role
const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    await EnterpriseRole.findByIdAndDelete(roleId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Assign a role to a sub-user
const assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    const user = await User.findByIdAndUpdate(userId, { 'profile.roleId': roleId }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetch enterprise branding info
const getEnterpriseBranding = async (req, res) => {
  console.log('[BRANDING] Controller hit. req.user:', req.user);
  try {
    console.log('[BRANDING] req.user.enterprise:', req.user && req.user.enterprise);
    const enterprise = req.user.enterprise || {};
    res.json({
      logo: enterprise.logo || '',
      companyName: enterprise.companyName || '',
      colors: enterprise.colors || { primary: '#1a3e72', secondary: '#f5f6fa' }
    });
  } catch (err) {
    console.log('[BRANDING] Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get audit logs for the enterprise (admin only)
const getAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const enterpriseId = req.user.enterprise.enterpriseId;
    const logs = await AuditLog.find({ enterpriseId }).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createRole,
  getRoles,
  updateRole,
  deleteRole,
  assignRoleToUser,
  getEnterpriseBranding,
  getAuditLogs
};

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role === 'admin' || req.user.role === 'superadmin') {
    return next();
  }

  return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};

// Middleware to check if user is a superadmin
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role === 'superadmin') {
    return next();
  }

  return res.status(403).json({ message: 'Access denied. SuperAdmin privileges required.' });
};

const EnterpriseRole = require('../models/EnterpriseRole');
const User = require('../models/User');

// Usage: checkPermission('products', 'edit')
function checkPermission(module, action) {
  return async (req, res, next) => {
    try {
      // Superadmin always allowed
      if (req.user.role === 'superadmin') return next();
      // Admins and users: check assigned role
      const roleId = req.user.profile && req.user.profile.roleId;
      if (!roleId) return res.status(403).json({ error: 'No role assigned' });
      const role = await EnterpriseRole.findById(roleId);
      if (!role) return res.status(403).json({ error: 'Role not found' });
      if (role.permissions && role.permissions[module] && role.permissions[module][action]) {
        return next();
      }
      return res.status(403).json({ error: 'Permission denied' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };
}

module.exports = { isAdmin, isSuperAdmin, checkPermission };

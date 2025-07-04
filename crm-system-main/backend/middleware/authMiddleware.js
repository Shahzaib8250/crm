const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('[AUTH] Incoming token:', token);
  if (!token) {
    console.log('[AUTH] No token provided, returning 401');
    return res.sendStatus(401);
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', async (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err);
        return res.status(403).json({ message: 'Invalid or expired token', error: err.message });
      }
      try {
        // Fetch the full user from the database
        const user = await User.findById(decoded.id);
        console.log('Decoded JWT:', decoded);
        if (!user) {
          console.log('No user found for decoded id:', decoded.id);
          return res.status(403).json({ message: 'User not found' });
        }
        console.log('Authenticated user in middleware:', user);
        req.user = user;
        next();
      } catch (dbErr) {
        console.error('Error fetching user from DB:', dbErr);
        return res.status(500).json({ message: 'Server error', error: dbErr.message });
      }
    });
  } catch (err) {
    console.log('[AUTH] JWT verification error:', err, 'returning 403');
    return res.sendStatus(403);
  }
};

// Middleware to check user role
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    
    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. ${roles.join(' or ')} role required.` 
      });
    }
    
    next();
  };
};

// Middleware to check CRM access for admins
const checkCrmAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    
    // SuperAdmin always has access
    if (req.user.role === 'superadmin') {
      return next();
    }
    
    // For other roles, check permissions
    if (req.user.role === 'admin') {
      // If using real DB
      const admin = await User.findById(req.user.id);
      if (!admin || !admin.permissions || !admin.permissions.crmAccess) {
        return res.status(403).json({ message: 'You do not have access to the CRM.' });
      }
    }
    
    // Users don't have access
    if (req.user.role === 'user') {
      return res.status(403).json({ message: 'Users do not have access to the CRM.' });
    }
    
    next();
  } catch (error) {
    console.error('CRM access check error:', error);
    res.status(500).json({ message: 'Internal server error checking CRM access.' });
  }
};

module.exports = { authenticateToken, authorizeRole, checkCrmAccess };

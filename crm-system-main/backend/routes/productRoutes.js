const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');

// Product CRUD operations - SuperAdmin only
router.post('/products', authenticateToken, authorizeRole('superadmin'), productController.createProduct);
router.get('/products/admin', authenticateToken, authorizeRole('superadmin'), productController.getAllProducts);
router.get('/products/:id', authenticateToken, authorizeRole('superadmin'), productController.getProductById);
router.put('/products/:id', authenticateToken, authorizeRole('superadmin'), productController.updateProduct);
router.delete('/products/:id', authenticateToken, authorizeRole('superadmin'), productController.deleteProduct);
router.post('/products/:id/regenerate-link', authenticateToken, authorizeRole('superadmin'), productController.regenerateAccessLink);

// Admin product access management - SuperAdmin only
router.post('/admins/:adminId/products/:productId/grant', authenticateToken, authorizeRole('superadmin'), productController.grantProductAccess);
router.post('/admins/:adminId/products/:productId/revoke', authenticateToken, authorizeRole('superadmin'), productController.revokeProductAccess);
router.get('/admins/:adminId/products', authenticateToken, authorizeRole('superadmin'), productController.getAdminProducts);

// Product analytics - SuperAdmin only
router.get('/products/:id/analytics', authenticateToken, authorizeRole('superadmin'), productController.getProductAnalytics);

// Protected routes - Admin and SuperAdmin access
router.get('/products', authenticateToken, productController.getAllProducts);

// Public route - Access products via link
router.get('/products/access/:accessLink', productController.getProductByAccessLink);

// CRM Product management for enterprise (admin/sub-user)
router.post('/crm/products', authenticateToken, checkPermission('products','add'), productController.createCrmProduct);
router.get('/crm/products', authenticateToken, checkPermission('products','view'), productController.getCrmProducts);
router.get('/crm/products/:id', authenticateToken, checkPermission('products','view'), productController.getCrmProductById);
router.put('/crm/products/:id', authenticateToken, checkPermission('products','edit'), productController.updateCrmProduct);
router.delete('/crm/products/:id', authenticateToken, checkPermission('products','delete'), productController.deleteCrmProduct);

module.exports = router;

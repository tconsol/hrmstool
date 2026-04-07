const express = require('express');
const router = express.Router();
const { auth, superAdminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/superAdminController');

// Auth (no middleware needed for login)
router.post('/login', ctrl.login);

// Protected routes (auth + superAdminOnly)
router.use(auth, superAdminOnly);

router.get('/me', ctrl.getMe);
router.put('/me', ctrl.updateProfile);
router.put('/change-password', ctrl.changePassword);

// Dashboard
router.get('/dashboard', ctrl.getDashboardStats);

// Organizations
router.get('/organizations', ctrl.getAllOrganizations);
router.get('/organizations/:id', ctrl.getOrganizationDetails);
router.patch('/organizations/:id/status', ctrl.toggleOrganizationStatus);
router.put('/organizations/:id/subscription', ctrl.updateSubscription);
router.delete('/organizations/:id', ctrl.deleteOrganization);

// Revenue
router.get('/revenue', ctrl.getRevenueReport);

// System
router.get('/settings', ctrl.getSystemSettings);
router.get('/audit-log', ctrl.getAuditLog);

module.exports = router;

const express = require('express');
const router = express.Router();
const { auth, superAdminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/superAdminController');

// Auth (no middleware needed for login)
router.post('/login', ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);

// Protected routes (auth + superAdminOnly)
router.use(auth, superAdminOnly);

router.get('/me', ctrl.getMe);
router.put('/me', ctrl.updateProfile);
router.put('/change-password', ctrl.changePassword);

// Dashboard
router.get('/dashboard', ctrl.getDashboardStats);

// Pending Organizations (approval workflow)
router.get('/organizations/pending', ctrl.getPendingOrganizations);
router.patch('/organizations/:id/approve', ctrl.approveOrganization);
router.patch('/organizations/:id/reject', ctrl.rejectOrganization);

// Organizations
router.get('/organizations', ctrl.getAllOrganizations);
router.get('/organizations/:id', ctrl.getOrganizationDetails);
router.patch('/organizations/:id/status', ctrl.toggleOrganizationStatus);
router.put('/organizations/:id/subscription', ctrl.updateSubscription);
router.delete('/organizations/:id', ctrl.deleteOrganization);

// Feature management
router.get('/features', ctrl.getFeatureList);
router.get('/organizations/:id/features', ctrl.getOrganizationFeatures);
router.put('/organizations/:id/features', ctrl.updateOrganizationFeatures);

// Revenue
router.get('/revenue', ctrl.getRevenueReport);

// System
router.get('/settings', ctrl.getSystemSettings);
router.get('/audit-log', ctrl.getAuditLog);

module.exports = router;

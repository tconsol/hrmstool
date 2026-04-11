const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const { getHRDashboard, getEmployeeDashboard, getManagerDashboard, getCEODashboard } = require('../controllers/dashboardController');

router.use(auth);
router.use(orgScope);

router.get('/hr', authorize('hr', 'manager', 'ceo'), getHRDashboard);
router.get('/manager', authorize('manager'), getManagerDashboard);
router.get('/ceo', authorize('ceo'), getCEODashboard);
router.get('/employee', getEmployeeDashboard);

module.exports = router;

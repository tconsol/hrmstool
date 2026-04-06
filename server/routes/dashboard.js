const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const { getHRDashboard, getEmployeeDashboard } = require('../controllers/dashboardController');

router.use(auth);

router.get('/hr', authorize('hr', 'manager', 'ceo'), getHRDashboard);
router.get('/employee', getEmployeeDashboard);

module.exports = router;

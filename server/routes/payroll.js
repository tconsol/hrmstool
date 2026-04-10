const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const requireFeature = require('../middleware/requireFeature');
const {
  generatePayroll,
  getPayrollList,
  getMyPayroll,
  updatePaymentStatus,
  downloadPayslip,
  getPayrollSummary,
} = require('../controllers/payrollController');

router.use(auth);
router.use(orgScope);
router.use(requireFeature('payroll'));

// Employee routes
router.get('/my', getMyPayroll);
router.get('/payslip/:id', downloadPayslip);

// Management routes
router.post('/generate', authorize('hr', 'manager', 'ceo'), generatePayroll);
router.get('/list', authorize('hr', 'manager', 'ceo'), getPayrollList);
router.get('/summary', authorize('hr', 'manager', 'ceo'), getPayrollSummary);
router.patch('/:id/status', authorize('hr', 'manager', 'ceo'), updatePaymentStatus);

module.exports = router;

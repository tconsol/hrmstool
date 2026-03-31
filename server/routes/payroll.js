const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const {
  generatePayroll,
  getPayrollList,
  getMyPayroll,
  updatePaymentStatus,
  downloadPayslip,
  getPayrollSummary,
} = require('../controllers/payrollController');

router.use(auth);

// Employee routes
router.get('/my', getMyPayroll);
router.get('/payslip/:id', downloadPayslip);

// HR routes
router.post('/generate', authorize('hr'), generatePayroll);
router.get('/list', authorize('hr'), getPayrollList);
router.get('/summary', authorize('hr'), getPayrollSummary);
router.patch('/:id/status', authorize('hr'), updatePaymentStatus);

module.exports = router;

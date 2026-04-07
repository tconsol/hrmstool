const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  getLeaveBalance,
} = require('../controllers/leaveController');

router.use(auth);
router.use(orgScope);

// Employee routes
router.post('/apply', applyLeave);
router.get('/my', getMyLeaves);
router.get('/balance', getLeaveBalance);
router.get('/balance/:userId', authorize('hr', 'manager', 'ceo'), getLeaveBalance);

// Management routes
router.get('/all', authorize('hr', 'manager', 'ceo'), getAllLeaves);
router.patch('/:id/status', authorize('hr', 'manager', 'ceo'), updateLeaveStatus);

module.exports = router;

const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  getLeaveBalance,
} = require('../controllers/leaveController');

router.use(auth);

// Employee routes
router.post('/apply', applyLeave);
router.get('/my', getMyLeaves);
router.get('/balance', getLeaveBalance);
router.get('/balance/:userId', authorize('hr'), getLeaveBalance);

// HR routes
router.get('/all', authorize('hr'), getAllLeaves);
router.patch('/:id/status', authorize('hr'), updateLeaveStatus);

module.exports = router;

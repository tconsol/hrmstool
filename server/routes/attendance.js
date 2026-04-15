const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const requireFeature = require('../middleware/requireFeature');
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getTodayStatus,
  getAllAttendance,
  markAttendance,
  getAttendanceSummary,
  cleanupDuplicateAttendance,
  getDuplicateAttendanceInfo,
  manualCheckout,
} = require('../controllers/attendanceController');

router.use(auth);
router.use(orgScope);
router.use(requireFeature('attendance'));

// Employee routes
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/my', getMyAttendance);
router.get('/today', getTodayStatus);

// Management routes
router.get('/all', authorize('hr', 'manager', 'ceo'), getAllAttendance);
router.post('/mark', authorize('hr', 'manager', 'ceo'), markAttendance);
router.get('/summary', authorize('hr', 'manager', 'ceo'), getAttendanceSummary);
router.post('/manual-checkout', authorize('hr', 'manager', 'ceo'), manualCheckout);

// Duplicate cleanup routes (HR/Manager/CEO only)
router.get('/admin/duplicates', authorize('hr', 'manager', 'ceo'), getDuplicateAttendanceInfo);
router.post('/admin/cleanup-duplicates', authorize('hr', 'manager', 'ceo'), cleanupDuplicateAttendance);

module.exports = router;

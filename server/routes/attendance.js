const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getTodayStatus,
  getAllAttendance,
  markAttendance,
  getAttendanceSummary,
} = require('../controllers/attendanceController');

router.use(auth);

// Employee routes
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/my', getMyAttendance);
router.get('/today', getTodayStatus);

// Management routes
router.get('/all', authorize('hr', 'manager', 'ceo'), getAllAttendance);
router.post('/mark', authorize('hr'), markAttendance);
router.get('/summary', authorize('hr', 'manager', 'ceo'), getAttendanceSummary);

module.exports = router;

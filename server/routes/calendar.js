const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  getEvents,
  getYearEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/calendarController');

// All authenticated users can read
router.get('/', auth, getEvents);
router.get('/year', auth, getYearEvents);

// Only HR can create / edit / delete
router.post('/', auth, authorize('hr'), createEvent);
router.put('/:id', auth, authorize('hr'), updateEvent);
router.delete('/:id', auth, authorize('hr'), deleteEvent);

module.exports = router;

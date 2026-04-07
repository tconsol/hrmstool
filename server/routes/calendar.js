const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const {
  getEvents,
  getYearEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/calendarController');

// All authenticated users can read
router.get('/', auth, orgScope, getEvents);
router.get('/year', auth, orgScope, getYearEvents);

// Only HR can create / edit / delete
router.post('/', auth, orgScope, authorize('hr'), createEvent);
router.put('/:id', auth, orgScope, authorize('hr'), updateEvent);
router.delete('/:id', auth, orgScope, authorize('hr'), deleteEvent);

module.exports = router;

const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const requireFeature = require('../middleware/requireFeature');
const {
  getEvents,
  getYearEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  sendEventInvites,
} = require('../controllers/calendarController');

const featureCheck = requireFeature('calendar');

// All authenticated users can read
router.get('/', auth, orgScope, featureCheck, getEvents);
router.get('/year', auth, orgScope, featureCheck, getYearEvents);

// HR/Manager/CEO can create / edit / delete
router.post('/', auth, orgScope, featureCheck, authorize('hr', 'manager', 'ceo'), createEvent);
router.put('/:id', auth, orgScope, featureCheck, authorize('hr', 'manager', 'ceo'), updateEvent);
router.delete('/:id', auth, orgScope, featureCheck, authorize('hr', 'manager', 'ceo'), deleteEvent);

// Send event invitations to all employees
router.post('/:id/send-invites', auth, orgScope, featureCheck, authorize('hr', 'manager', 'ceo'), sendEventInvites);

module.exports = router;

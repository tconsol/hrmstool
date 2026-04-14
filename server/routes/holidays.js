const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const requireFeature = require('../middleware/requireFeature');
const {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  syncIndiaHolidays,
} = require('../controllers/holidayController');

router.use(auth);
router.use(orgScope);
router.use(requireFeature('holidays'));

router.get('/', getHolidays);
router.post('/', authorize('hr', 'manager', 'ceo'), createHoliday);
router.post('/sync/india', authorize('hr', 'manager', 'ceo'), syncIndiaHolidays);
router.put('/:id', authorize('hr', 'manager', 'ceo'), updateHoliday);
router.delete('/:id', authorize('hr', 'manager', 'ceo'), deleteHoliday);

module.exports = router;

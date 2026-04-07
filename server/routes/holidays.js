const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} = require('../controllers/holidayController');

router.use(auth);
router.use(orgScope);

router.get('/', getHolidays);
router.post('/', authorize('hr', 'ceo'), createHoliday);
router.put('/:id', authorize('hr', 'ceo'), updateHoliday);
router.delete('/:id', authorize('hr', 'ceo'), deleteHoliday);

module.exports = router;

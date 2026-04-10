const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const requireFeature = require('../middleware/requireFeature');
const {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
} = require('../controllers/shiftController');

router.use(auth);
router.use(orgScope);
router.use(requireFeature('shifts'));

router.get('/', getShifts);
router.post('/', authorize('hr', 'manager', 'ceo'), createShift);
router.put('/:id', authorize('hr', 'manager', 'ceo'), updateShift);
router.delete('/:id', authorize('hr', 'manager', 'ceo'), deleteShift);

module.exports = router;

const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
} = require('../controllers/shiftController');

router.use(auth);
router.use(orgScope);

router.get('/', getShifts);
router.post('/', authorize('hr'), createShift);
router.put('/:id', authorize('hr'), updateShift);
router.delete('/:id', authorize('hr'), deleteShift);

module.exports = router;

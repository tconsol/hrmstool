const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const {
  getTrainings,
  getTraining,
  createTraining,
  updateTraining,
  enrollInTraining,
  deleteTraining,
} = require('../controllers/trainingController');

router.use(auth);
router.use(orgScope);

router.get('/', getTrainings);
router.get('/:id', getTraining);
router.post('/', authorize('hr', 'manager', 'ceo'), createTraining);
router.put('/:id', authorize('hr', 'manager', 'ceo'), updateTraining);
router.post('/:id/enroll', enrollInTraining);
router.delete('/:id', authorize('hr', 'ceo'), deleteTraining);

module.exports = router;

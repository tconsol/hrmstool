const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const requireFeature = require('../middleware/requireFeature');
const {
  getTrainings,
  getTraining,
  createTraining,
  updateTraining,
  enrollInTraining,
  deleteTraining,
  updateParticipantStatus,
  removeParticipant,
} = require('../controllers/trainingController');

router.use(auth);
router.use(orgScope);
router.use(requireFeature('training'));

router.get('/', getTrainings);
router.get('/:id', getTraining);
router.post('/', authorize('hr', 'manager', 'ceo'), createTraining);
router.put('/:id', authorize('hr', 'manager', 'ceo'), updateTraining);
router.post('/:id/enroll', enrollInTraining);
router.delete('/:id', authorize('hr', 'manager', 'ceo'), deleteTraining);
router.put('/:id/participant-status', authorize('hr', 'manager', 'ceo'), updateParticipantStatus);
router.post('/:id/remove-participant', authorize('hr', 'manager', 'ceo'), removeParticipant);

module.exports = router;

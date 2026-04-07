const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');

router.use(auth);
router.use(orgScope);

router.get('/', getAnnouncements);
router.post('/', authorize('hr', 'ceo'), createAnnouncement);
router.put('/:id', authorize('hr', 'ceo'), updateAnnouncement);
router.delete('/:id', authorize('hr', 'ceo'), deleteAnnouncement);

module.exports = router;

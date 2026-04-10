const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const requireFeature = require('../middleware/requireFeature');
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');

router.use(auth);
router.use(orgScope);
router.use(requireFeature('announcements'));

router.get('/', getAnnouncements);
router.post('/', authorize('hr', 'manager', 'ceo'), createAnnouncement);
router.put('/:id', authorize('hr', 'manager', 'ceo'), updateAnnouncement);
router.delete('/:id', authorize('hr', 'manager', 'ceo'), deleteAnnouncement);

module.exports = router;

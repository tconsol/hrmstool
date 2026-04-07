const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const {
  getOrganization,
  updateOrganization,
  getOrganizationSettings,
  updateOrganizationSettings,
} = require('../controllers/organizationController');

router.use(auth);
router.use(orgScope);

router.get('/', getOrganization);
router.put('/', authorize('hr', 'ceo'), updateOrganization);
router.get('/settings', getOrganizationSettings);
router.put('/settings', authorize('hr', 'ceo'), updateOrganizationSettings);

module.exports = router;

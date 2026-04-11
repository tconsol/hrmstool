const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const {
  getOrganization,
  updateOrganization,
  getOrganizationSettings,
  updateOrganizationSettings,
  syncLeavePolicyToUsers,
  getOfficeLocations,
  addOfficeLocation,
  updateOfficeLocation,
  deleteOfficeLocation,
  validateCheckInLocation,
} = require('../controllers/organizationController');

router.use(auth);
router.use(orgScope);

router.get('/', getOrganization);
router.put('/', authorize('ceo'), updateOrganization);
router.get('/settings', getOrganizationSettings);
router.put('/settings', authorize('ceo'), updateOrganizationSettings);
router.post('/sync-leave-policy', authorize('ceo'), syncLeavePolicyToUsers);

// Office locations — all staff can read; only hr/manager/ceo can manage
router.get('/locations', getOfficeLocations);
router.post('/locations', authorize('hr', 'manager', 'ceo'), addOfficeLocation);
router.put('/locations/:locationId', authorize('hr', 'manager', 'ceo'), updateOfficeLocation);
router.delete('/locations/:locationId', authorize('hr', 'manager', 'ceo'), deleteOfficeLocation);
router.post('/location/validate-checkin', validateCheckInLocation);

module.exports = router;

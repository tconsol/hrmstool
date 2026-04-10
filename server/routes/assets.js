const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const requireFeature = require('../middleware/requireFeature');
const {
  getAssets,
  getMyAssets,
  createAsset,
  updateAsset,
  assignAsset,
  deleteAsset,
} = require('../controllers/assetController');

router.use(auth);
router.use(orgScope);
router.use(requireFeature('assets'));

// Employee route
router.get('/my', getMyAssets);

// Management routes
router.get('/', authorize('hr', 'manager', 'ceo'), getAssets);
router.post('/', authorize('hr', 'manager', 'ceo'), createAsset);
router.put('/:id', authorize('hr', 'manager', 'ceo'), updateAsset);
router.patch('/:id/assign', authorize('hr', 'manager', 'ceo'), assignAsset);
router.delete('/:id', authorize('hr', 'manager', 'ceo'), deleteAsset);

module.exports = router;

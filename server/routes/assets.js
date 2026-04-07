const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
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

// Employee route
router.get('/my', getMyAssets);

// Management routes
router.get('/', authorize('hr', 'manager', 'ceo'), getAssets);
router.post('/', authorize('hr'), createAsset);
router.put('/:id', authorize('hr'), updateAsset);
router.patch('/:id/assign', authorize('hr'), assignAsset);
router.delete('/:id', authorize('hr'), deleteAsset);

module.exports = router;

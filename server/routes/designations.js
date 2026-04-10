const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const {
  getDesignations,
  createDesignation,
  getDesignation,
  updateDesignation,
  deleteDesignation,
} = require('../controllers/designationController');

router.use(auth);
router.use(orgScope);

// Employee routes
router.get('/', getDesignations);

// Management routes
router.post('/', authorize('hr', 'manager', 'ceo'), createDesignation);
router.get('/:id', authorize('hr', 'manager', 'ceo'), getDesignation);
router.put('/:id', authorize('hr', 'manager', 'ceo'), updateDesignation);
router.delete('/:id', authorize('hr', 'manager', 'ceo'), deleteDesignation);

module.exports = router;

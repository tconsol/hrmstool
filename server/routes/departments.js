const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const requireFeature = require('../middleware/requireFeature');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');

router.use(auth);
router.use(orgScope);
router.use(requireFeature('departments'));

router.get('/', getDepartments);
router.get('/:id', getDepartment);
router.post('/', authorize('hr', 'manager', 'ceo'), createDepartment);
router.put('/:id', authorize('hr', 'manager', 'ceo'), updateDepartment);
router.delete('/:id', authorize('hr', 'manager', 'ceo'), deleteDepartment);

module.exports = router;

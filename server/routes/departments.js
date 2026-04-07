const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');

router.use(auth);
router.use(orgScope);

router.get('/', getDepartments);
router.get('/:id', getDepartment);
router.post('/', authorize('hr', 'ceo'), createDepartment);
router.put('/:id', authorize('hr', 'ceo'), updateDepartment);
router.delete('/:id', authorize('hr', 'ceo'), deleteDepartment);

module.exports = router;

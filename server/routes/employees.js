const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getEmployees,
  getEmployee,
  addEmployee,
  updateEmployee,
  toggleStatus,
  getDepartments,
  addEmployeeValidation,
  updateEmployeeValidation,
} = require('../controllers/employeeController');

router.use(auth);

router.get('/', authorize('hr'), getEmployees);
router.get('/departments', authorize('hr'), getDepartments);
router.get('/:id', authorize('hr'), getEmployee);
router.post('/', authorize('hr'), addEmployeeValidation, validate, addEmployee);
router.put('/:id', authorize('hr'), updateEmployeeValidation, validate, updateEmployee);
router.patch('/:id/toggle-status', authorize('hr'), toggleStatus);

module.exports = router;

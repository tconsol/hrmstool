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

router.get('/', authorize('hr', 'manager', 'ceo'), getEmployees);
router.get('/departments', authorize('hr', 'manager', 'ceo'), getDepartments);
router.get('/:id', authorize('hr', 'manager', 'ceo'), getEmployee);
router.post('/', authorize('hr'), addEmployeeValidation, validate, addEmployee);
router.put('/:id', authorize('hr'), updateEmployeeValidation, validate, updateEmployee);
router.patch('/:id/toggle-status', authorize('hr'), toggleStatus);

module.exports = router;

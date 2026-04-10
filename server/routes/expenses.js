const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const requireFeature = require('../middleware/requireFeature');
const {
  getExpenses,
  getMyExpenses,
  submitExpense,
  updateExpenseStatus,
  deleteExpense,
  getExpenseSummary,
} = require('../controllers/expenseController');

router.use(auth);
router.use(orgScope);
router.use(requireFeature('expenses'));

// Employee routes
router.get('/my', getMyExpenses);
router.post('/', submitExpense);
router.delete('/:id', deleteExpense);

// Management routes
router.get('/', authorize('hr', 'manager', 'ceo'), getExpenses);
router.get('/summary', authorize('hr', 'manager', 'ceo'), getExpenseSummary);
router.patch('/:id/status', authorize('hr', 'manager', 'ceo'), updateExpenseStatus);

module.exports = router;

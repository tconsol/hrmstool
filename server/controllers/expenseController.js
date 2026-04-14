const Expense = require('../models/Expense');
const { parseLocalDate } = require('../utils/dateParser');

exports.getExpenses = async (req, res) => {
  try {
    const { status, category, employee, page = 1, limit = 20 } = req.query;
    const query = { organization: req.orgId };

    if (status) query.status = status;
    if (category) query.category = category;
    if (employee) query.employee = employee;

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .populate('employee', 'name employeeId department designation')
      .populate({
        path: 'employee',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'name code level' }
        ]
      })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      expenses,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

exports.getMyExpenses = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { organization: req.orgId, employee: req.user._id };

    if (status) query.status = status;

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      expenses,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

exports.submitExpense = async (req, res) => {
  try {
    const { category, amount, description, receipt, date } = req.body;

    if (!category || !amount || !description || !date) {
      return res.status(400).json({ error: 'Category, amount, description and date are required' });
    }

    const expense = new Expense({
      employee: req.user._id,
      category,
      amount,
      description,
      receipt,
      date: parseLocalDate(date),
      organization: req.orgId,
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit expense' });
  }
};

exports.updateExpenseStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!['approved', 'rejected', 'reimbursed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      {
        status,
        remarks,
        approvedBy: req.user._id,
      },
      { new: true }
    ).populate('employee', 'name employeeId department')
     .populate('approvedBy', 'name');

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, organization: req.orgId });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Check authorization: either manager/hr/ceo role or owner of the expense
    const isManagement = ['hr', 'manager', 'ceo'].includes(req.user.role);
    const isOwner = expense.user.toString() === req.user._id.toString();
    
    if (!isManagement && !isOwner) {
      return res.status(403).json({ error: 'Unauthorized to delete this expense' });
    }

    // Non-management users can only delete pending expenses
    if (!isManagement && expense.status !== 'pending') {
      return res.status(400).json({ error: 'Can only delete pending expenses' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};

exports.getExpenseSummary = async (req, res) => {
  try {
    const summary = await Expense.aggregate([
      { $match: { organization: req.orgId } },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const byCategory = await Expense.aggregate([
      { $match: { organization: req.orgId, status: { $in: ['approved', 'reimbursed'] } } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({ byStatus: summary, byCategory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expense summary' });
  }
};

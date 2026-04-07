const { body } = require('express-validator');
const User = require('../models/User');
const { generateEmployeeId } = require('./authController');

exports.addEmployeeValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
  body('department').optional().trim(),
  body('designation').optional().trim(),
  body('salary').optional().isNumeric().withMessage('Salary must be a number'),
  body('role').optional().isIn(['hr', 'manager', 'ceo', 'employee']).withMessage('Invalid role'),
];

exports.updateEmployeeValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('department').optional().trim(),
  body('designation').optional().trim(),
  body('salary').optional().isNumeric().withMessage('Salary must be a number'),
  body('role').optional().isIn(['hr', 'manager', 'ceo', 'employee']).withMessage('Invalid role'),
];

exports.getEmployees = async (req, res) => {
  try {
    const { search, department, status, role, page = 1, limit = 10 } = req.query;
    const query = { organization: req.orgId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }
    if (department) query.department = department;
    if (status) query.status = status;
    if (role) query.role = role;

    const total = await User.countDocuments(query);
    const employees = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      employees,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

exports.getEmployee = async (req, res) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, organization: req.orgId }).select('-password');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

exports.addEmployee = async (req, res) => {
  try {
    const { email } = req.body;

    const existing = await User.findOne({ email, organization: req.orgId });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const employeeId = await generateEmployeeId(req.orgId);

    const employee = new User({
      ...req.body,
      employeeId,
      organization: req.orgId,
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add employee' });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // Don't allow password update through this route

    const employee = await User.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, organization: req.orgId });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    employee.status = employee.status === 'active' ? 'inactive' : 'active';
    await employee.save();

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await User.distinct('department', { organization: req.orgId, department: { $ne: '' } });
    res.json(departments.filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

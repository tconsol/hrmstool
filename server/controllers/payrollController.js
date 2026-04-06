const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Leave = require('../models/Leave');
const { generatePayslipPDF } = require('../utils/generatePayslip');

exports.generatePayroll = async (req, res) => {
  try {
    const { month, year, employeeId } = req.body;

    let employees;
    if (employeeId) {
      const emp = await User.findById(employeeId);
      if (!emp) return res.status(404).json({ error: 'Employee not found' });
      employees = [emp];
    } else {
      employees = await User.find({ status: 'active' });
    }

    const results = [];

    for (const emp of employees) {
      // Check if payroll already exists
      const existing = await Payroll.findOne({ user: emp._id, month, year });
      if (existing) {
        results.push({ employee: emp.name, status: 'already exists' });
        continue;
      }

      // Calculate deductions based on leaves
      const approvedLeaves = await Leave.find({
        user: emp._id,
        status: 'approved',
        startDate: { $gte: new Date(year, month - 1, 1) },
        endDate: { $lte: new Date(year, month, 0) },
      });

      const totalLeaveDays = approvedLeaves.reduce((sum, l) => sum + l.totalDays, 0);
      const perDaySalary = emp.salary / 30;
      const leaveDeduction = Math.max(0, totalLeaveDays > 2 ? (totalLeaveDays - 2) * perDaySalary : 0);
      const taxDeduction = emp.salary > 50000 ? emp.salary * 0.1 : 0;

      const totalDeductions = parseFloat((leaveDeduction + taxDeduction).toFixed(2));
      const totalBonuses = 0;
      const netSalary = parseFloat((emp.salary - totalDeductions + totalBonuses).toFixed(2));

      const payroll = new Payroll({
        user: emp._id,
        month,
        year,
        baseSalary: emp.salary,
        deductions: {
          leave: parseFloat(leaveDeduction.toFixed(2)),
          tax: parseFloat(taxDeduction.toFixed(2)),
          other: 0,
        },
        bonuses: { performance: 0, festival: 0, other: 0 },
        totalDeductions,
        totalBonuses,
        netSalary,
        generatedBy: req.user._id,
      });

      await payroll.save();
      results.push({ employee: emp.name, status: 'generated', netSalary });
    }

    res.json({ message: 'Payroll generated', results });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Payroll already exists for this period' });
    }
    res.status(500).json({ error: 'Failed to generate payroll' });
  }
};

exports.getPayrollList = async (req, res) => {
  try {
    const { month, year, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.paymentStatus = status;

    const total = await Payroll.countDocuments(query);
    const payrolls = await Payroll.find(query)
      .populate('user', 'name email employeeId department designation')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      payrolls,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payroll list' });
  }
};

exports.getMyPayroll = async (req, res) => {
  try {
    const { year } = req.query;
    const query = { user: req.user._id };

    if (year) query.year = parseInt(year);

    const payrolls = await Payroll.find(query).sort({ year: -1, month: -1 });
    res.json(payrolls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch salary records' });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus: status,
        paymentDate: status === 'paid' ? new Date() : null,
      },
      { new: true }
    ).populate('user', 'name email employeeId');

    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment status' });
  }
};

exports.downloadPayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('user', 'name email employeeId department designation joiningDate');

    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    // Check if employee can only access own payslip
    if (req.user.role === 'employee' && payroll.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const bw = req.query.bw === 'true';
    const pdfBuffer = await generatePayslipPDF(payroll, bw);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${payroll.user.employeeId}_${payroll.month}_${payroll.year}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate payslip' });
  }
};

exports.getPayrollSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const summary = await Payroll.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalBaseSalary: { $sum: '$baseSalary' },
          totalDeductions: { $sum: '$totalDeductions' },
          totalBonuses: { $sum: '$totalBonuses' },
          totalNetSalary: { $sum: '$netSalary' },
          totalPayrolls: { $sum: 1 },
          paidCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] } },
        },
      },
    ]);

    res.json(summary[0] || {
      totalBaseSalary: 0,
      totalDeductions: 0,
      totalBonuses: 0,
      totalNetSalary: 0,
      totalPayrolls: 0,
      paidCount: 0,
      pendingCount: 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payroll summary' });
  }
};

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');

exports.getHRDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalEmployees,
      activeEmployees,
      presentToday,
      pendingLeaves,
      currentMonth,
      departments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Attendance.countDocuments({ date: today, status: { $in: ['present', 'late'] } }),
      Leave.countDocuments({ status: 'pending' }),
      Payroll.aggregate([
        { $match: { month: today.getMonth() + 1, year: today.getFullYear() } },
        { $group: { _id: null, total: { $sum: '$netSalary' }, count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Recent leaves
    const recentLeaves = await Leave.find({ status: 'pending' })
      .populate('user', 'name employeeId department')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent employees
    const recentEmployees = await User.find()
      .select('name employeeId department joiningDate status')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalEmployees,
        activeEmployees,
        presentToday,
        pendingLeaves,
        payrollTotal: currentMonth[0]?.total || 0,
        payrollCount: currentMonth[0]?.count || 0,
      },
      departments,
      recentLeaves,
      recentEmployees,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

exports.getEmployeeDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userId = req.user._id;

    const [
      todayAttendance,
      leaveBalance,
      monthAttendance,
      recentLeaves,
      latestPayroll,
    ] = await Promise.all([
      Attendance.findOne({ user: userId, date: today }),
      User.findById(userId).select('leaveBalance'),
      Attendance.countDocuments({
        user: userId,
        date: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        status: { $in: ['present', 'late'] },
      }),
      Leave.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(3),
      Payroll.findOne({ user: userId })
        .sort({ year: -1, month: -1 }),
    ]);

    res.json({
      todayAttendance,
      leaveBalance: leaveBalance?.leaveBalance,
      monthAttendance,
      recentLeaves,
      latestPayroll,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

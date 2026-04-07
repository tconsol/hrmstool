const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Announcement = require('../models/Announcement');
const Department = require('../models/Department');

exports.getHRDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orgFilter = { organization: req.orgId };

    const [
      totalEmployees,
      activeEmployees,
      presentToday,
      pendingLeaves,
      currentMonth,
      departments,
    ] = await Promise.all([
      User.countDocuments(orgFilter),
      User.countDocuments({ ...orgFilter, status: 'active' }),
      Attendance.countDocuments({ ...orgFilter, date: today, status: { $in: ['present', 'late'] } }),
      Leave.countDocuments({ ...orgFilter, status: 'pending' }),
      Payroll.aggregate([
        { $match: { organization: req.orgId, month: today.getMonth() + 1, year: today.getFullYear() } },
        { $group: { _id: null, total: { $sum: '$netSalary' }, count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { organization: req.orgId, status: 'active' } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
        { $project: { _id: 1, count: 1, name: { $ifNull: [{ $arrayElemAt: ['$dept.name', 0] }, 'Unassigned'] } } },
      ]),
    ]);

    const recentLeaves = await Leave.find({ ...orgFilter, status: 'pending' })
      .populate('user', 'name employeeId department designation')
      .populate('user.department', 'name')
      .populate('user.designation', 'name code')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentEmployees = await User.find(orgFilter)
      .select('name employeeId department designation joiningDate status')
      .populate('department', 'name code')
      .populate('designation', 'name code level')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get active announcements
    const announcements = await Announcement.find({
      organization: req.orgId,
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
    })
      .populate('createdBy', 'name')
      .sort({ priority: -1, createdAt: -1 })
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
      announcements,
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
    const orgFilter = { organization: req.orgId };

    const [
      todayAttendance,
      leaveBalance,
      monthAttendance,
      recentLeaves,
      latestPayroll,
    ] = await Promise.all([
      Attendance.findOne({ ...orgFilter, user: userId, date: today }),
      User.findById(userId).select('leaveBalance'),
      Attendance.countDocuments({
        ...orgFilter,
        user: userId,
        date: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        status: { $in: ['present', 'late'] },
      }),
      Leave.find({ ...orgFilter, user: userId })
        .sort({ createdAt: -1 })
        .limit(3),
      Payroll.findOne({ ...orgFilter, user: userId })
        .sort({ year: -1, month: -1 }),
    ]);

    // Get active announcements for this user's role
    const announcements = await Announcement.find({
      organization: req.orgId,
      isActive: true,
      $and: [
        { $or: [{ targetRoles: { $size: 0 } }, { targetRoles: req.user.role }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }] },
      ],
    })
      .populate('createdBy', 'name')
      .sort({ priority: -1, createdAt: -1 })
      .limit(5);

    res.json({
      todayAttendance,
      leaveBalance: leaveBalance?.leaveBalance,
      monthAttendance,
      recentLeaves,
      latestPayroll,
      announcements,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

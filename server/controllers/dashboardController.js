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
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalEmployees,
      activeEmployees,
      presentToday,
      lateToday,
      absentToday,
      pendingLeaves,
      approvedLeavesMonth,
      currentMonth,
      payrollPaid,
      payrollPending,
      departments,
      leaveByType,
    ] = await Promise.all([
      User.countDocuments(orgFilter),
      User.countDocuments({ ...orgFilter, status: 'active' }),
      Attendance.countDocuments({ ...orgFilter, date: today, status: 'present' }),
      Attendance.countDocuments({ ...orgFilter, date: today, status: 'late' }),
      Attendance.countDocuments({ ...orgFilter, date: today, status: 'absent' }),
      Leave.countDocuments({ ...orgFilter, status: 'pending' }),
      Leave.countDocuments({ ...orgFilter, status: 'approved', startDate: { $gte: monthStart } }),
      Payroll.aggregate([
        { $match: { organization: req.orgId, month: today.getMonth() + 1, year: today.getFullYear() } },
        { $group: { _id: null, total: { $sum: '$netSalary' }, count: { $sum: 1 } } },
      ]),
      Payroll.countDocuments({ organization: req.orgId, month: today.getMonth() + 1, year: today.getFullYear(), paymentStatus: 'paid' }),
      Payroll.countDocuments({ organization: req.orgId, month: today.getMonth() + 1, year: today.getFullYear(), paymentStatus: 'pending' }),
      User.aggregate([
        { $match: { organization: req.orgId, status: 'active' } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
        { $project: { _id: 1, count: 1, name: { $ifNull: [{ $arrayElemAt: ['$dept.name', 0] }, 'Unassigned'] } } },
      ]),
      Leave.aggregate([
        { $match: { organization: req.orgId, createdAt: { $gte: monthStart } } },
        { $group: { _id: '$leaveType', count: { $sum: 1 } } },
      ]),
    ]);

    const recentLeaves = await Leave.find({ ...orgFilter, status: 'pending' })
      .populate({
        path: 'user',
        select: 'name employeeId department designation',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'designation', select: 'name' },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentEmployees = await User.find(orgFilter)
      .select('name employeeId department designation joiningDate status')
      .populate('department', 'name')
      .populate('designation', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const announcements = await Announcement.find({
      organization: req.orgId,
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
    })
      .populate('createdBy', 'name')
      .sort({ priority: -1, createdAt: -1 })
      .limit(3);

    const attendanceRate = activeEmployees > 0
      ? Math.round(((presentToday + lateToday) / activeEmployees) * 100)
      : 0;

    res.json({
      stats: {
        totalEmployees,
        activeEmployees,
        presentToday: presentToday + lateToday,
        lateToday,
        absentToday,
        pendingLeaves,
        approvedLeavesMonth,
        payrollTotal: currentMonth[0]?.total || 0,
        payrollCount: currentMonth[0]?.count || 0,
        payrollPaid,
        payrollPending,
        attendanceRate,
      },
      departments,
      leaveByType,
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

exports.getManagerDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orgFilter = { organization: req.orgId };
    const managerId = req.user._id;
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // --- Org-wide data (same as HR/CEO) ---
    const [
      totalEmployees,
      activeEmployees,
      orgPresentToday,
      orgLateToday,
      orgPendingLeaves,
      approvedLeavesMonth,
      rejectedLeavesMonth,
      currentMonth,
      payrollPaid,
      payrollPending,
      departments,
      leaveByType,
    ] = await Promise.all([
      User.countDocuments(orgFilter),
      User.countDocuments({ ...orgFilter, status: 'active' }),
      Attendance.countDocuments({ ...orgFilter, date: today, status: 'present' }),
      Attendance.countDocuments({ ...orgFilter, date: today, status: 'late' }),
      Leave.countDocuments({ ...orgFilter, status: 'pending' }),
      Leave.countDocuments({ ...orgFilter, status: 'approved', startDate: { $gte: monthStart } }),
      Leave.countDocuments({ ...orgFilter, status: 'rejected', startDate: { $gte: monthStart } }),
      Payroll.aggregate([
        { $match: { organization: req.orgId, month: today.getMonth() + 1, year: today.getFullYear() } },
        { $group: { _id: null, total: { $sum: '$netSalary' }, count: { $sum: 1 } } },
      ]),
      Payroll.countDocuments({ organization: req.orgId, month: today.getMonth() + 1, year: today.getFullYear(), paymentStatus: 'paid' }),
      Payroll.countDocuments({ organization: req.orgId, month: today.getMonth() + 1, year: today.getFullYear(), paymentStatus: 'pending' }),
      User.aggregate([
        { $match: { organization: req.orgId, status: 'active' } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
        { $project: { _id: 1, count: 1, name: { $ifNull: [{ $arrayElemAt: ['$dept.name', 0] }, 'Unassigned'] } } },
      ]),
      Leave.aggregate([
        { $match: { organization: req.orgId, createdAt: { $gte: monthStart } } },
        { $group: { _id: '$leaveType', count: { $sum: 1 } } },
      ]),
    ]);

    const attendanceRate = activeEmployees > 0
      ? Math.round(((orgPresentToday + orgLateToday) / activeEmployees) * 100)
      : 0;

    // --- Team-specific data ---
    const manager = await User.findById(managerId).select('department');
    const managerDeptId = manager?.department;

    let teamMembers = [];
    if (managerDeptId) {
      teamMembers = await User.find({
        ...orgFilter,
        department: managerDeptId,
        status: 'active',
        _id: { $ne: managerId },
      })
        .select('name employeeId department designation status joiningDate')
        .populate('department', 'name')
        .populate('designation', 'name')
        .sort({ name: 1 });
    }
    if (teamMembers.length === 0) {
      teamMembers = await User.find({
        ...orgFilter,
        reportingManager: managerId,
        status: 'active',
      })
        .select('name employeeId department designation status joiningDate')
        .populate('department', 'name')
        .populate('designation', 'name')
        .sort({ name: 1 });
    }

    const teamMemberIds = teamMembers.map(m => m._id);

    const [teamPresentToday, teamLateToday, teamPendingLeaves, monthlyAttendance] = await Promise.all([
      Attendance.countDocuments({ ...orgFilter, date: today, status: 'present', user: { $in: teamMemberIds } }),
      Attendance.countDocuments({ ...orgFilter, date: today, status: 'late', user: { $in: teamMemberIds } }),
      Leave.countDocuments({ ...orgFilter, status: 'pending', user: { $in: teamMemberIds } }),
      Attendance.aggregate([
        { $match: { ...orgFilter, user: { $in: teamMemberIds }, date: { $gte: monthStart } } },
        { $group: { _id: null, present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } }, total: { $sum: 1 } } },
      ]),
    ]);

    const todayAttendanceRecords = await Attendance.find({
      ...orgFilter,
      date: today,
      user: { $in: teamMemberIds },
    }).select('user status checkIn checkOut workHours checkInMode');

    const attendanceMap = {};
    todayAttendanceRecords.forEach(r => { attendanceMap[r.user.toString()] = r; });

    const teamWithAttendance = teamMembers.map(m => ({
      ...m.toObject(),
      todayAttendance: attendanceMap[m._id.toString()] || null,
    }));

    const recentLeaves = await Leave.find({ ...orgFilter, status: 'pending' })
      .populate({ path: 'user', select: 'name employeeId department', populate: { path: 'department', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(5);

    const teamMonthlyRate = monthlyAttendance[0]?.total > 0
      ? Math.round((monthlyAttendance[0].present / monthlyAttendance[0].total) * 100)
      : 0;

    res.json({
      stats: {
        // Org-wide
        totalEmployees,
        activeEmployees,
        presentToday: orgPresentToday + orgLateToday,
        lateToday: orgLateToday,
        pendingLeaves: orgPendingLeaves,
        approvedLeavesMonth,
        rejectedLeavesMonth,
        payrollTotal: currentMonth[0]?.total || 0,
        payrollCount: currentMonth[0]?.count || 0,
        payrollPaid,
        payrollPending,
        attendanceRate,
        // Team-specific
        teamSize: teamMembers.length,
        teamPresentToday: teamPresentToday + teamLateToday,
        teamPendingLeaves,
        teamMonthlyRate,
      },
      departments,
      leaveByType,
      teamMembers: teamWithAttendance,
      recentLeaves,
    });
  } catch (error) {    res.status(500).json({ error: 'Failed to fetch manager dashboard data' });
  }
};

exports.getCEODashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orgFilter = { organization: req.orgId };
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalEmployees,
      activeEmployees,
      presentToday,
      lateToday,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      currentMonth,
      payrollPaid,
      payrollPending,
      departments,
      roleDistribution,
    ] = await Promise.all([
      User.countDocuments(orgFilter),
      User.countDocuments({ ...orgFilter, status: 'active' }),
      Attendance.countDocuments({ ...orgFilter, date: today, status: 'present' }),
      Attendance.countDocuments({ ...orgFilter, date: today, status: 'late' }),
      Leave.countDocuments({ ...orgFilter, status: 'pending' }),
      Leave.countDocuments({ ...orgFilter, status: 'approved', startDate: { $gte: monthStart } }),
      Leave.countDocuments({ ...orgFilter, status: 'rejected', startDate: { $gte: monthStart } }),
      Payroll.aggregate([
        { $match: { organization: req.orgId, month: today.getMonth() + 1, year: today.getFullYear() } },
        { $group: { _id: null, total: { $sum: '$netSalary' }, count: { $sum: 1 } } },
      ]),
      Payroll.countDocuments({ organization: req.orgId, month: today.getMonth() + 1, year: today.getFullYear(), paymentStatus: 'paid' }),
      Payroll.countDocuments({ organization: req.orgId, month: today.getMonth() + 1, year: today.getFullYear(), paymentStatus: 'pending' }),
      User.aggregate([
        { $match: { organization: req.orgId, status: 'active' } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
        { $project: { _id: 1, count: 1, name: { $ifNull: [{ $arrayElemAt: ['$dept.name', 0] }, 'Unassigned'] } } },
      ]),
      User.aggregate([
        { $match: { organization: req.orgId, status: 'active' } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
    ]);

    const recentLeaves = await Leave.find({ ...orgFilter, status: 'pending' })
      .populate({ path: 'user', select: 'name employeeId department', populate: { path: 'department', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(5);

    const attendanceRate = activeEmployees > 0
      ? Math.round(((presentToday + lateToday) / activeEmployees) * 100)
      : 0;

    res.json({
      stats: {
        totalEmployees,
        activeEmployees,
        presentToday: presentToday + lateToday,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        payrollTotal: currentMonth[0]?.total || 0,
        payrollCount: currentMonth[0]?.count || 0,
        payrollPaid,
        payrollPending,
        attendanceRate,
      },
      departments,
      roleDistribution,
      recentLeaves,
    });
  } catch (error) {    res.status(500).json({ error: 'Failed to fetch CEO dashboard data' });
  }
};

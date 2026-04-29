const Leave = require('../models/Leave');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getIO } = require('../utils/socket');
const { parseLocalDateRange } = require('../utils/dateParser');

/**
 * Create a notification and emit it via Socket.IO to the recipient's room.
 */
const createAndEmitNotification = async ({ recipient, sender, type, title, message, data = {}, orgId }) => {
  try {
    const notification = await Notification.create({ recipient, sender, type, title, message, data, organization: orgId });
    const populated = await notification.populate('sender', 'name employeeId');
    try {
      getIO().to(`user_${recipient}`).emit('notification', populated);
    } catch (sockErr) { /* socket emit failed */ }
    return notification;
  } catch (err) {
    throw err;
  }
};

exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const { startDate: start, endDate: end } = parseLocalDateRange(startDate, endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (totalDays <= 0) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Check leave balance
    const user = await User.findById(req.user._id);
    if (user.leaveBalance[leaveType] < totalDays) {
      return res.status(400).json({
        error: `Insufficient ${leaveType} leave balance. Available: ${user.leaveBalance[leaveType]} days`,
      });
    }

    // Check for overlapping leaves
    const overlapping = await Leave.findOne({
      user: req.user._id,
      status: { $ne: 'rejected' },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (overlapping) {
      return res.status(400).json({ error: 'You already have a leave request for these dates' });
    }

    const leave = new Leave({
      user: req.user._id,
      organization: req.orgId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
    });

    await leave.save();

    // Notify all HR users that an employee applied for leave
    try {
      const hrUsers = await User.find({ organization: req.orgId, role: { $in: ['hr', 'manager', 'ceo'] }, status: 'active' }).select('_id');
      const applicant = await User.findById(req.user._id)
        .select('name employeeId department designation')
        .populate('department', 'name')
        .populate('designation', 'name code');
      await Promise.all(
        hrUsers.map((hr) =>
          createAndEmitNotification({
            recipient: hr._id,
            sender: req.user._id,
            type: 'leave_applied',
            title: 'New Leave Application',
            message: `${applicant.name} applied for ${leaveType} leave from ${start.toDateString()} to ${end.toDateString()} (${totalDays} day${totalDays > 1 ? 's' : ''}).`,
            data: { leaveId: leave._id, employeeId: applicant.employeeId, department: applicant.department },
            orgId: req.orgId,
          })
        )
      );
      // Also emit org-wide leave_update so leave management pages refresh live
      try {
        const populatedLeave = await Leave.findById(leave._id)
          .populate({ path: 'user', select: 'name employeeId department designation', populate: [{ path: 'department', select: 'name' }, { path: 'designation', select: 'name' }] })
          .populate('approvedBy', 'name');
        getIO().to(`org_${req.orgId}`).emit('leave_update', { action: 'new', leave: populatedLeave });
      } catch { /* silent */ }
    } catch (notifErr) { /* notification failed */ }

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply leave' });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const { status, year } = req.query;
    const query = { user: req.user._id, organization: req.orgId };

    if (status) query.status = status;
    if (year) {
      query.startDate = {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31),
      };
    }

    const leaves = await Leave.find(query)
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    const user = await User.findById(req.user._id).select('leaveBalance');

    res.json({ leaves, leaveBalance: user.leaveBalance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaves' });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const { status, department, page = 1, limit = 20 } = req.query;
    const query = { organization: req.orgId };

    if (status) query.status = status;

    const total = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .populate('user', 'name email employeeId department designation')
      .populate({
        path: 'user',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'name code level' }
        ]
      })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    let filtered = leaves;
    if (department) {
      filtered = leaves.filter(l => l.user && l.user.department === department);
    }

    res.json({
      leaves: filtered,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const leave = await Leave.findOne({ _id: req.params.id, organization: req.orgId });
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Leave request already processed' });
    }

    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.remarks = remarks;
    await leave.save();

    // Update leave balance if approved
    if (status === 'approved') {
      await User.findByIdAndUpdate(leave.user, {
        $inc: { [`leaveBalance.${leave.leaveType}`]: -leave.totalDays },
      });
    }

    // Notify the employee of the decision
    try {
      const approver = await User.findById(req.user._id).select('name');
      await createAndEmitNotification({
        recipient: leave.user,
        sender: req.user._id,
        type: status === 'approved' ? 'leave_approved' : 'leave_rejected',
        title: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your ${leave.leaveType} leave request (${new Date(leave.startDate).toDateString()} – ${new Date(leave.endDate).toDateString()}) has been ${status} by ${approver.name}.${remarks ? ` Remark: ${remarks}` : ''}`,
        data: { leaveId: leave._id, status },
        orgId: req.orgId,
      });
    } catch (notifErr) { /* notification failed */ }

    // Emit org-wide leave_update so leave management pages refresh live
    try {
      getIO().to(`org_${req.orgId}`).emit('leave_update', { action: 'status_change', leaveId: leave._id.toString(), status });
    } catch { /* silent */ }

    res.json(leave);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update leave status' });
  }
};

exports.getLeaveBalance = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const user = await User.findById(userId).select('leaveBalance');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.leaveBalance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leave balance' });
  }
};

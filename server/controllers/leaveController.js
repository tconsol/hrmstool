const Leave = require('../models/Leave');
const User = require('../models/User');

exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);
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
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
    });

    await leave.save();
    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply leave' });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const { status, year } = req.query;
    const query = { user: req.user._id };

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
    const query = {};

    if (status) query.status = status;

    const total = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .populate('user', 'name email employeeId department designation')
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

    const leave = await Leave.findById(req.params.id);
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

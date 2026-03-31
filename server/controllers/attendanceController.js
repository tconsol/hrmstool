const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Get today's date normalized to midnight
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

exports.checkIn = async (req, res) => {
  try {
    const today = getToday();
    const existingRecord = await Attendance.findOne({
      user: req.user._id,
      date: today,
    });

    if (existingRecord && existingRecord.checkIn) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const now = new Date();
    const lateThreshold = new Date(today);
    lateThreshold.setHours(9, 30, 0, 0); // 9:30 AM

    const status = now > lateThreshold ? 'late' : 'present';

    const attendance = existingRecord || new Attendance({
      user: req.user._id,
      date: today,
    });

    attendance.checkIn = now;
    attendance.status = status;
    attendance.markedBy = 'self';
    await attendance.save();

    res.json(attendance);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Attendance already marked for today' });
    }
    res.status(500).json({ error: 'Failed to check in' });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const today = getToday();
    const attendance = await Attendance.findOne({
      user: req.user._id,
      date: today,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ error: 'No check-in found for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    attendance.checkOut = new Date();
    attendance.workHours = parseFloat(
      ((attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60)).toFixed(2)
    );
    await attendance.save();

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check out' });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = { user: req.user._id };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

exports.getTodayStatus = async (req, res) => {
  try {
    const today = getToday();
    const attendance = await Attendance.findOne({
      user: req.user._id,
      date: today,
    });
    res.json(attendance || { status: 'not-marked' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today status' });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const { date, department, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      query.date = targetDate;
    }

    if (status) query.status = status;

    let attendanceQuery = Attendance.find(query)
      .populate('user', 'name email employeeId department designation')
      .sort({ date: -1 });

    const total = await Attendance.countDocuments(query);
    const attendance = await attendanceQuery
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Filter by department if needed  
    let filtered = attendance;
    if (department) {
      filtered = attendance.filter(a => a.user && a.user.department === department);
    }

    res.json({
      attendance: filtered,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { userId, date, status, notes } = req.body;

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      user: userId,
      date: targetDate,
    });

    if (attendance) {
      attendance.status = status;
      attendance.notes = notes;
      attendance.markedBy = 'hr';
    } else {
      attendance = new Attendance({
        user: userId,
        date: targetDate,
        status,
        notes,
        markedBy: 'hr',
        checkIn: status !== 'absent' ? new Date(targetDate.setHours(9, 0, 0, 0)) : null,
      });
    }

    await attendance.save();
    res.json(attendance);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Attendance already exists for this date' });
    }
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const summary = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$user',
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          halfDay: { $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] } },
          totalHours: { $sum: '$workHours' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employee',
        },
      },
      { $unwind: '$employee' },
      {
        $project: {
          employeeId: '$employee.employeeId',
          name: '$employee.name',
          department: '$employee.department',
          present: 1,
          absent: 1,
          late: 1,
          halfDay: 1,
          totalHours: 1,
        },
      },
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
};

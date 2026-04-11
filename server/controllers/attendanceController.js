const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { isWithinOfficeRange } = require('./organizationController');

// Get today's date normalized to midnight
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

exports.checkIn = async (req, res) => {
  try {
    const { latitude, longitude, checkInMode = 'office' } = req.body;

    const org = await Organization.findById(req.orgId).select('officeLocations settings');

    // Location check — skip if remote mode, otherwise check if org has configured active locations
    if (checkInMode !== 'remote') {
      const activeLocations = (org?.officeLocations || []).filter(l => l.isActive && l.latitude);
      if (activeLocations.length > 0) {
        if (latitude === undefined || longitude === undefined) {
          return res.status(403).json({
            error: 'Location required',
            message: 'This organization requires location access for check-in. Please allow location permission.',
            isLocationError: true,
          });
        }
        const isInAnyOffice = activeLocations.some(loc =>
          isWithinOfficeRange(latitude, longitude, loc.latitude, loc.longitude, loc.radiusMeters)
        );
        if (!isInAnyOffice) {
          const names = activeLocations.map(l => l.name).join(', ');
          return res.status(403).json({
            error: 'Location check-in failed',
            message: `You are not within the required range of any office location (${names}). Please reach the office first.`,
            isLocationError: true,
            officeLocations: activeLocations.map(l => ({ name: l.name, address: l.address, radiusMeters: l.radiusMeters })),
          });
        }
      }
    }

    const today = getToday();
    const existingRecord = await Attendance.findOne({
      user: req.user._id,
      organization: req.orgId,
      date: today,
    });

    if (existingRecord && existingRecord.checkIn) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const now = new Date();
    const lateThreshold = new Date(today);
    const shiftTime = org?.settings?.shiftStartTime || '09:00';
    const [hours, mins] = shiftTime.split(':');
    lateThreshold.setHours(parseInt(hours), parseInt(mins), 0, 0);

    const status = now > lateThreshold ? 'late' : 'present';

    const attendance = existingRecord || new Attendance({
      user: req.user._id,
      organization: req.orgId,
      date: today,
    });

    attendance.checkIn = now;
    attendance.status = status;
    attendance.markedBy = 'self';
    attendance.checkInMode = checkInMode;
    attendance.checkInLocation = latitude && longitude ? { latitude, longitude } : undefined;
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
      organization: req.orgId,
      date: today,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ error: 'No check-in found for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    attendance.checkOut = new Date();
    const diffMs = attendance.checkOut.getTime() - new Date(attendance.checkIn).getTime();
    attendance.workHours = Math.max(0, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));
    await attendance.save();

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check out' });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = { user: req.user._id, organization: req.orgId };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });
    
    // Enrich response with checkInMode
    const attendanceWithMode = attendance.map(a => ({
      ...a.toObject(),
      checkInMode: a.checkInMode || 'office',
      checkIn: a.checkIn,
      checkOut: a.checkOut,
      workHours: a.workHours,
      status: a.status,
      markedBy: a.markedBy,
      notes: a.notes,
    }));
    
    res.json(attendanceWithMode);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

exports.getTodayStatus = async (req, res) => {
  try {
    const today = getToday();
    const attendance = await Attendance.findOne({
      user: req.user._id,
      organization: req.orgId,
      date: today,
    });
    const result = attendance ? {
      ...attendance.toObject(),
      checkInMode: attendance.checkInMode || 'office',
    } : { status: 'not-marked' };
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today status' });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const { date, department, status, page = 1, limit = 20 } = req.query;
    const query = { organization: req.orgId };

    if (date) {
      const [y, m, d] = date.split('-').map(Number);
      const targetDate = new Date(y, m - 1, d); // local midnight, matches how records are stored
      query.date = targetDate;
    }

    if (status) query.status = status;

    let attendanceQuery = Attendance.find(query)
      .populate({
        path: 'user',
        select: 'name email employeeId department designation status salary checkInMode',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'name code level' }
        ]
      })
      .sort({ date: -1, createdAt: -1 });

    const total = await Attendance.countDocuments(query);
    const attendance = await attendanceQuery
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Filter by department if needed  
    let filtered = attendance;
    if (department) {
      filtered = attendance.filter(a => a.user && a.user.department && 
        (a.user.department._id?.toString() === department || a.user.department.name === department)
      );
    }

    // Enrich response with checkInMode
    const attendanceWithMode = filtered.map(a => ({
      ...a.toObject(),
      checkInMode: a.checkInMode || 'office',
      checkIn: a.checkIn,
      checkOut: a.checkOut,
      workHours: a.workHours,
      status: a.status,
      markedBy: a.markedBy,
      notes: a.notes,
    }));

    res.json({
      attendance: attendanceWithMode,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { userId, date, status, notes, checkInMode = 'office' } = req.body;

    const [yd, md, dd] = date.split('-').map(Number);
    const targetDate = new Date(yd, md - 1, dd); // local midnight

    let attendance = await Attendance.findOne({
      user: userId,
      organization: req.orgId,
      date: targetDate,
    });

    const defaultHours = status === 'present' || status === 'late' ? 8 : status === 'half-day' ? 4 : 0;
    const checkInTime = status !== 'absent' ? new Date(new Date(targetDate).setHours(9, 0, 0, 0)) : null;
    const checkOutTime = status !== 'absent' ? new Date(new Date(targetDate).setHours(status === 'half-day' ? 13 : 18, 0, 0, 0)) : null;

    if (attendance) {
      attendance.status = status;
      attendance.notes = notes;
      attendance.markedBy = 'hr';
      attendance.checkIn = checkInTime;
      attendance.checkOut = checkOutTime;
      attendance.workHours = defaultHours;
      attendance.checkInMode = checkInMode;
    } else {
      attendance = new Attendance({
        user: userId,
        organization: req.orgId,
        date: targetDate,
        status,
        notes,
        markedBy: 'hr',
        checkIn: checkInTime,
        checkOut: checkOutTime,
        workHours: defaultHours,
        checkInMode: checkInMode,
      });
    }

    await attendance.save();
    res.json(attendance);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Attendance already exists for this date' });
    }
    console.error('Error marking attendance:', error);
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
          organization: req.user.organization,
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

// Check for and fix duplicate records (admin endpoint)
exports.cleanupDuplicateAttendance = async (req, res) => {
  try {
    const logs = [];
    
    // Find all attendance records grouped by user, organization, and date
    const duplicates = await Attendance.aggregate([
      { $group: {
          _id: { user: '$user', organization: '$organization', date: '$date' },
          count: { $sum: 1 },
          records: { $push: '$_id' },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    if (duplicates.length === 0) {
      return res.json({ message: 'No duplicate records found', cleaned: 0 });
    }

    let cleanedCount = 0;
    for (const dup of duplicates) {
      // Keep the first record, delete the rest
      const recordsToDelete = dup.records.slice(1);
      const result = await Attendance.deleteMany({ _id: { $in: recordsToDelete } });
      cleanedCount += result.deletedCount;
      logs.push({
        group: dup._id,
        deleted: result.deletedCount,
        kept: dup.records[0],
      });
    }

    res.json({
      message: `Cleaned up ${cleanedCount} duplicate records`,
      cleaned: cleanedCount,
      details: logs,
    });
  } catch (error) {
    console.error('Error cleaning duplicates:', error);
    res.status(500).json({ error: 'Failed to cleanup duplicates' });
  }
};

// Get duplicate records info (admin endpoint for inspection)
exports.getDuplicateAttendanceInfo = async (req, res) => {
  try {
    const duplicates = await Attendance.aggregate([
      { $group: {
          _id: { user: '$user', organization: '$organization', date: '$date' },
          count: { $sum: 1 },
          records: { $push: { _id: '$_id', checkInMode: '$checkInMode', checkIn: '$checkIn', checkOut: '$checkOut', status: '$status' } },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { '_id.date': -1 } },
    ]);

    res.json({
      duplicateGroups: duplicates.length,
      details: duplicates,
    });
  } catch (error) {
    console.error('Error getting duplicate info:', error);
    res.status(500).json({ error: 'Failed to fetch duplicate info' });
  }
};

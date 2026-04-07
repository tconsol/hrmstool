const Shift = require('../models/Shift');

exports.getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find({ organization: req.orgId }).sort({ name: 1 });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
};

exports.createShift = async (req, res) => {
  try {
    const { name, startTime, endTime, graceMinutes, isDefault } = req.body;

    if (!name || !startTime || !endTime) {
      return res.status(400).json({ error: 'Name, start time and end time are required' });
    }

    // If marking as default, unset other defaults
    if (isDefault) {
      await Shift.updateMany({ organization: req.orgId }, { isDefault: false });
    }

    const shift = new Shift({
      name,
      startTime,
      endTime,
      graceMinutes: graceMinutes || 30,
      isDefault: isDefault || false,
      organization: req.orgId,
    });

    await shift.save();
    res.status(201).json(shift);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Shift name already exists' });
    }
    res.status(500).json({ error: 'Failed to create shift' });
  }
};

exports.updateShift = async (req, res) => {
  try {
    const allowedFields = ['name', 'startTime', 'endTime', 'graceMinutes', 'isDefault'];
    const updates = {};
    allowedFields.forEach(field => {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    });

    if (updates.isDefault) {
      await Shift.updateMany({ organization: req.orgId }, { isDefault: false });
    }

    const shift = await Shift.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      updates,
      { new: true, runValidators: true }
    );

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update shift' });
  }
};

exports.deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findOneAndDelete({ _id: req.params.id, organization: req.orgId });
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    res.json({ message: 'Shift deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete shift' });
  }
};

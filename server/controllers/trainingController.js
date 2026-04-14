const Training = require('../models/Training');
const { parseLocalDateRange } = require('../utils/dateParser');

exports.getTrainings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { organization: req.orgId };

    if (status) query.status = status;

    const total = await Training.countDocuments(query);
    const trainings = await Training.find(query)
      .populate('participants.user', 'name employeeId department designation')
      .populate({
        path: 'participants.user',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'name code level' }
        ]
      })
      .populate('createdBy', 'name')
      .sort({ startDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      trainings,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trainings' });
  }
};

exports.getTraining = async (req, res) => {
  try {
    const training = await Training.findOne({ _id: req.params.id, organization: req.orgId })
      .populate('participants.user', 'name employeeId department designation')
      .populate({
        path: 'participants.user',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'name code level' }
        ]
      })
      .populate('createdBy', 'name');

    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }

    res.json(training);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch training' });
  }
};

exports.createTraining = async (req, res) => {
  try {
    const { title, description, type, trainer, startDate, endDate, maxParticipants } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ error: 'Title, start date and end date are required' });
    }

    const { startDate: start, endDate: end } = parseLocalDateRange(startDate, endDate);

    const training = new Training({
      title,
      description,
      type: type || 'online',
      trainer,
      startDate: start,
      endDate: end,
      maxParticipants: maxParticipants || 0,
      createdBy: req.user._id,
      organization: req.orgId,
    });

    await training.save();
    const populated = await training.populate('createdBy', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create training' });
  }
};

exports.updateTraining = async (req, res) => {
  try {
    const allowedFields = ['title', 'description', 'type', 'trainer', 'startDate', 'endDate', 'location', 'maxParticipants', 'status'];
    const updates = {};
    allowedFields.forEach(field => {
      if (field in req.body) {
        if (field === 'startDate' || field === 'endDate') {
          updates[field] = parseLocalDate(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    const training = await Training.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      updates,
      { new: true, runValidators: true }
    )
      .populate('participants.user', 'name employeeId department designation')
      .populate({
        path: 'participants.user',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'name code level' }
        ]
      })
      .populate('createdBy', 'name');

    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }

    res.json(training);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update training' });
  }
};

exports.enrollInTraining = async (req, res) => {
  try {
    // Use atomic findOneAndUpdate to prevent race conditions
    const training = await Training.findOneAndUpdate(
      {
        _id: req.params.id,
        organization: req.orgId,
        status: { $nin: ['cancelled', 'completed'] },
        'participants.user': { $ne: req.user._id },
        $or: [
          { maxParticipants: { $lte: 0 } },
          { $expr: { $lt: [{ $size: '$participants' }, '$maxParticipants'] } }
        ]
      },
      { $push: { participants: { user: req.user._id } } },
      { new: true, runValidators: true }
    )
      .populate('participants.user', 'name employeeId department designation')
      .populate({
        path: 'participants.user',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'name code level' }
        ]
      })
      .populate('createdBy', 'name');

    if (!training) {
      // Determine which validation failed
      const originalTraining = await Training.findOne({ _id: req.params.id, organization: req.orgId });
      if (!originalTraining) {
        return res.status(404).json({ error: 'Training not found' });
      }
      if (originalTraining.status === 'cancelled' || originalTraining.status === 'completed') {
        return res.status(400).json({ error: 'Training is not available for enrollment' });
      }
      if (originalTraining.participants.some(p => p.user.toString() === req.user._id.toString())) {
        return res.status(400).json({ error: 'Already enrolled in this training' });
      }
      if (originalTraining.maxParticipants > 0 && originalTraining.participants.length >= originalTraining.maxParticipants) {
        return res.status(400).json({ error: 'Training is full' });
      }
      return res.status(400).json({ error: 'Cannot enroll in this training' });
    }

    res.json(training);
  } catch (error) {
    res.status(500).json({ error: 'Failed to enroll in training' });
  }
};

exports.deleteTraining = async (req, res) => {
  try {
    const training = await Training.findOneAndDelete({ _id: req.params.id, organization: req.orgId });
    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }
    res.json({ message: 'Training deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete training' });
  }
};

exports.updateParticipantStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;
    
    if (!userId || !status) {
      return res.status(400).json({ error: 'User ID and status are required' });
    }

    if (!['enrolled', 'completed', 'dropped', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const training = await Training.findOneAndUpdate(
      { 
        _id: req.params.id, 
        organization: req.orgId,
        'participants.user': userId
      },
      { 
        $set: { 'participants.$[elem].status': status }
      },
      { 
        arrayFilters: [{ 'elem.user': userId }],
        new: true,
        runValidators: true
      }
    )
      .populate('participants.user', 'name employeeId department designation')
      .populate({
        path: 'participants.user',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'name code level' }
        ]
      })
      .populate('createdBy', 'name');

    if (!training) {
      return res.status(404).json({ error: 'Training or participant not found' });
    }

    res.json(training);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update participant status' });
  }
};

exports.removeParticipant = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const training = await Training.findOneAndUpdate(
      { 
        _id: req.params.id, 
        organization: req.orgId,
        'participants.user': userId
      },
      { 
        $pull: { participants: { user: userId } }
      },
      { new: true, runValidators: true }
    )
      .populate('participants.user', 'name employeeId department designation')
      .populate({
        path: 'participants.user',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'name code level' }
        ]
      })
      .populate('createdBy', 'name');

    if (!training) {
      return res.status(404).json({ error: 'Training or participant not found' });
    }

    res.json(training);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove participant' });
  }
};

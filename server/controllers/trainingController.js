const Training = require('../models/Training');

exports.getTrainings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { organization: req.orgId };

    if (status) query.status = status;

    const total = await Training.countDocuments(query);
    const trainings = await Training.find(query)
      .populate('participants.user', 'name employeeId department')
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
      .populate('participants.user', 'name employeeId department')
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

    const training = new Training({
      title,
      description,
      type: type || 'online',
      trainer,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
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
    const training = await Training.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('participants.user', 'name employeeId department')
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
    const training = await Training.findOne({ _id: req.params.id, organization: req.orgId });
    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }

    if (training.status === 'cancelled' || training.status === 'completed') {
      return res.status(400).json({ error: 'Training is not available for enrollment' });
    }

    const alreadyEnrolled = training.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );
    if (alreadyEnrolled) {
      return res.status(400).json({ error: 'Already enrolled in this training' });
    }

    if (training.maxParticipants > 0 && training.participants.length >= training.maxParticipants) {
      return res.status(400).json({ error: 'Training is full' });
    }

    training.participants.push({ user: req.user._id });
    await training.save();

    const populated = await training.populate([
      { path: 'participants.user', select: 'name employeeId department' },
      { path: 'createdBy', select: 'name' },
    ]);

    res.json(populated);
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

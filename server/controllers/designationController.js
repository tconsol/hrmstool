const Designation = require('../models/Designation');

exports.getDesignations = async (req, res) => {
  try {
    const designations = await Designation.find({ organization: req.orgId }).sort('name');
    res.json(designations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch designations' });
  }
};

exports.createDesignation = async (req, res) => {
  try {
    const { name, code, description, level } = req.body;

    const exists = await Designation.findOne({ organization: req.orgId, name });
    if (exists) {
      return res.status(400).json({ error: 'Designation already exists' });
    }

    const designation = new Designation({
      name,
      code,
      description,
      level,
      organization: req.orgId,
    });

    await designation.save();
    res.status(201).json(designation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create designation' });
  }
};

exports.getDesignation = async (req, res) => {
  try {
    const designation = await Designation.findOne({
      _id: req.params.id,
      organization: req.orgId,
    });

    if (!designation) {
      return res.status(404).json({ error: 'Designation not found' });
    }

    res.json(designation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch designation' });
  }
};

exports.updateDesignation = async (req, res) => {
  try {
    const allowedFields = ['name', 'code', 'description', 'level', 'isActive'];
    const updates = {};
    allowedFields.forEach(field => {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    });

    const designation = await Designation.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      updates,
      { new: true, runValidators: true }
    );

    if (!designation) {
      return res.status(404).json({ error: 'Designation not found' });
    }

    res.json(designation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update designation' });
  }
};

exports.deleteDesignation = async (req, res) => {
  try {
    const designation = await Designation.findOneAndDelete({
      _id: req.params.id,
      organization: req.orgId,
    });

    if (!designation) {
      return res.status(404).json({ error: 'Designation not found' });
    }

    res.json({ message: 'Designation deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete designation' });
  }
};

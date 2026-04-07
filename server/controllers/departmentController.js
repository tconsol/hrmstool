const Department = require('../models/Department');

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ organization: req.orgId })
      .populate('head', 'name employeeId')
      .sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

exports.getDepartment = async (req, res) => {
  try {
    const department = await Department.findOne({ _id: req.params.id, organization: req.orgId })
      .populate('head', 'name employeeId designation');
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(department);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch department' });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description, head } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const existing = await Department.findOne({ organization: req.orgId, name });
    if (existing) {
      return res.status(400).json({ error: 'Department name already exists' });
    }

    const department = new Department({
      name,
      code,
      description,
      head,
      organization: req.orgId,
    });

    await department.save();
    const populated = await department.populate('head', 'name employeeId');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create department' });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const allowedFields = ['name', 'description', 'head'];
    const updates = {};
    allowedFields.forEach(field => {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    });

    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      updates,
      { new: true, runValidators: true }
    ).populate('head', 'name employeeId');

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(department);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update department' });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findOneAndDelete({ _id: req.params.id, organization: req.orgId });
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete department' });
  }
};

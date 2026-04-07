const Organization = require('../models/Organization');

exports.getOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.orgId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    delete updates.slug;
    delete updates.createdBy;

    const org = await Organization.findByIdAndUpdate(
      req.orgId,
      updates,
      { new: true, runValidators: true }
    );

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(org);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update organization' });
  }
};

exports.getOrganizationSettings = async (req, res) => {
  try {
    const org = await Organization.findById(req.orgId).select('settings name logo');
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

exports.updateOrganizationSettings = async (req, res) => {
  try {
    const org = await Organization.findById(req.orgId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (req.body.settings) {
      org.settings = { ...org.settings.toObject(), ...req.body.settings };
    }

    await org.save();
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

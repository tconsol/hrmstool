const Asset = require('../models/Asset');

exports.getAssets = async (req, res) => {
  try {
    const { status, type, assignedTo, page = 1, limit = 20 } = req.query;
    const query = { organization: req.orgId };

    if (status) query.status = status;
    if (type) query.type = type;
    if (assignedTo) query.assignedTo = assignedTo;

    const total = await Asset.countDocuments(query);
    const assets = await Asset.find(query)
      .populate('assignedTo', 'name employeeId department designation')
      .populate({
        path: 'assignedTo',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'name code level' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      assets,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
};

exports.getMyAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ organization: req.orgId, assignedTo: req.user._id })
      .populate('assignedTo', 'name employeeId department designation')
      .populate({
        path: 'assignedTo',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'name code level' }
        ]
      })
      .sort({ assignedDate: -1 });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
};

exports.createAsset = async (req, res) => {
  try {
    const { name, type, brand, model, serialNumber, purchaseDate, purchaseCost, warrantyExpiry, notes } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const asset = new Asset({
      name,
      type,
      brand,
      model,
      serialNumber,
      purchaseDate,
      purchaseCost,
      warrantyExpiry,
      notes,
      organization: req.orgId,
    });

    await asset.save();
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create asset' });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const allowedFields = ['name', 'type', 'brand', 'model', 'serialNumber', 'status', 'assignedDate', 'notes'];
    const updates = {};
    allowedFields.forEach(field => {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    });

    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      updates,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name employeeId department');

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update asset' });
  }
};

exports.assignAsset = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      {
        assignedTo: assignedTo || null,
        assignedDate: assignedTo ? new Date() : null,
        status: assignedTo ? 'assigned' : 'available',
      },
      { new: true }
    ).populate('assignedTo', 'name employeeId department');

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign asset' });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findOneAndDelete({ _id: req.params.id, organization: req.orgId });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json({ message: 'Asset deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete asset' });
  }
};

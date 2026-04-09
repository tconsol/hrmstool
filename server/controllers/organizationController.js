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

    // Check if user is attempting to modify sensitive fields without being super-admin
    const sensitiveFields = ['subscription', 'isActive', 'email'];
    const isSuperAdmin = req.user.role === 'superadmin' || req.user.isSuperAdmin;
    
    if (!isSuperAdmin) {
      sensitiveFields.forEach(field => {
        delete updates[field];
      });
    }

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
      org.settings = {
        ...org.settings.toObject ? org.settings.toObject() : org.settings,
        ...req.body.settings
      };
    }

    await org.save();
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Haversine helper (used here and by attendanceController)
// ─────────────────────────────────────────────────────────────────────────────
const isWithinOfficeRange = (empLat, empLng, officeLat, officeLng, radiusMeters) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(officeLat - empLat);
  const dLng = toRad(officeLng - empLng);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(empLat)) * Math.cos(toRad(officeLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= radiusMeters;
};
module.exports.isWithinOfficeRange = isWithinOfficeRange;

// GET all office locations
exports.getOfficeLocations = async (req, res) => {
  try {
    const org = await Organization.findById(req.orgId).select('officeLocations');
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json(org.officeLocations || []);
  } catch {
    res.status(500).json({ error: 'Failed to fetch office locations' });
  }
};

// POST add a new office location
exports.addOfficeLocation = async (req, res) => {
  try {
    const { name, address = '', latitude, longitude, radiusMeters = 50 } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Location name is required' });
    if (latitude === undefined || longitude === undefined)
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    if (typeof latitude !== 'number' || typeof longitude !== 'number')
      return res.status(400).json({ error: 'Latitude and longitude must be numbers' });
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
      return res.status(400).json({ error: 'Invalid latitude or longitude' });

    const org = await Organization.findByIdAndUpdate(
      req.orgId,
      { $push: { officeLocations: { name: name.trim(), address, latitude, longitude, radiusMeters: Math.max(10, radiusMeters), isActive: true } } },
      { new: true, runValidators: true }
    );
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    res.status(201).json({ message: 'Office location added', officeLocations: org.officeLocations });
  } catch {
    res.status(500).json({ error: 'Failed to add office location' });
  }
};

// PUT update an existing office location by its subdocument _id
exports.updateOfficeLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { name, address, latitude, longitude, radiusMeters, isActive } = req.body;

    if (latitude !== undefined || longitude !== undefined) {
      const lat = latitude ?? 0;
      const lng = longitude ?? 0;
      if (typeof lat !== 'number' || typeof lng !== 'number')
        return res.status(400).json({ error: 'Latitude and longitude must be numbers' });
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
        return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    const updateFields = {};
    if (name !== undefined) updateFields['officeLocations.$.name'] = name.trim();
    if (address !== undefined) updateFields['officeLocations.$.address'] = address;
    if (latitude !== undefined) updateFields['officeLocations.$.latitude'] = latitude;
    if (longitude !== undefined) updateFields['officeLocations.$.longitude'] = longitude;
    if (radiusMeters !== undefined) updateFields['officeLocations.$.radiusMeters'] = Math.max(10, radiusMeters);
    if (isActive !== undefined) updateFields['officeLocations.$.isActive'] = isActive;

    const org = await Organization.findOneAndUpdate(
      { _id: req.orgId, 'officeLocations._id': locationId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    if (!org) return res.status(404).json({ error: 'Location not found' });

    res.json({ message: 'Office location updated', officeLocations: org.officeLocations });
  } catch {
    res.status(500).json({ error: 'Failed to update office location' });
  }
};

// DELETE remove an office location
exports.deleteOfficeLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const org = await Organization.findByIdAndUpdate(
      req.orgId,
      { $pull: { officeLocations: { _id: locationId } } },
      { new: true }
    );
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json({ message: 'Office location deleted', officeLocations: org.officeLocations });
  } catch {
    res.status(500).json({ error: 'Failed to delete office location' });
  }
};

// POST validate employee check-in against all active office locations
exports.validateCheckInLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined)
      return res.status(400).json({ error: 'latitude and longitude are required' });

    const org = await Organization.findById(req.orgId).select('officeLocations');
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const active = (org.officeLocations || []).filter(l => l.isActive && l.latitude);
    if (active.length === 0)
      return res.status(400).json({ error: 'No office locations configured' });

    const matchedLocation = active.find(loc =>
      isWithinOfficeRange(latitude, longitude, loc.latitude, loc.longitude, loc.radiusMeters)
    );

    res.json({
      isInRange: !!matchedLocation,
      matchedLocation: matchedLocation ? { name: matchedLocation.name, address: matchedLocation.address } : null,
      officeLocations: active.map(l => ({ name: l.name, address: l.address, radiusMeters: l.radiusMeters })),
    });
  } catch {
    res.status(500).json({ error: 'Failed to validate location' });
  }
};


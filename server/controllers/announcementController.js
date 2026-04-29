const Announcement = require('../models/Announcement');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getIO } = require('../utils/socket');

exports.getAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 20, active } = req.query;
    const query = { organization: req.orgId };

    if (active === 'true') {
      query.isActive = true;
      query.$or = [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }];
    }

    const total = await Announcement.countDocuments(query);
    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      announcements,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority, targetRoles, expiresAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const announcement = new Announcement({
      title,
      content,
      priority: priority || 'medium',
      targetRoles: targetRoles || [],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user._id,
      organization: req.orgId,
    });

    await announcement.save();
    const populated = await announcement.populate('createdBy', 'name');

    // Push real-time notification to all targeted users
    try {
      const roleFilter = targetRoles && targetRoles.length > 0 ? { role: { $in: targetRoles } } : {};
      const usersToNotify = await User.find({
        organization: req.orgId,
        status: 'active',
        _id: { $ne: req.user._id },
        ...roleFilter,
      }).select('_id');

      await Promise.all(usersToNotify.map(async (u) => {
        const notif = await Notification.create({
          recipient: u._id,
          sender: req.user._id,
          type: 'general',
          title: `📢 ${title}`,
          message: content.length > 120 ? content.substring(0, 120) + '…' : content,
          organization: req.orgId,
        });
        const pop = await notif.populate('sender', 'name employeeId');
        getIO().to(`user_${u._id}`).emit('notification', pop);
      }));
    } catch (e) {    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const allowedFields = ['title', 'content', 'priority', 'pinned', 'expiresAt', 'targetRoles', 'isActive'];
    const updates = {};
    allowedFields.forEach(field => {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    });

    const announcement = await Announcement.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update announcement' });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOneAndDelete({ _id: req.params.id, organization: req.orgId });
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};

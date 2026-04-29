const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');

// DEBUG: Check all HR users
router.get('/hr-users', auth, async (req, res) => {
  try {
    const hrUsers = await User.find({ role: 'hr' }).select('_id name email isActive');
    res.json({ 
      total: hrUsers.length, 
      users: hrUsers,
      currentUser: req.user.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DEBUG: Test creating a notification
router.post('/test-notification', auth, async (req, res) => {
  try {
    const notif = await Notification.create({
      recipient: req.user._id,
      sender: req.user._id,
      type: 'general',
      title: 'Test Notification',
      message: 'This is a test notification',
    });    res.json({ success: true, notif });
  } catch (error) {    res.status(500).json({ error: error.message });
  }
});

// DEBUG: Check all notifications in DB
router.get('/notifications', auth, async (req, res) => {
  try {
    const notifs = await Notification.find().populate('recipient', 'name email').populate('sender', 'name email');
    res.json({ total: notifs.length, notifs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DEBUG: Check notifications for current user
router.get('/my-notifications', auth, async (req, res) => {
  try {
    const notifs = await Notification.find({ recipient: req.user._id }).populate('sender', 'name email');
    res.json({ total: notifs.length, notifs, userId: req.user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


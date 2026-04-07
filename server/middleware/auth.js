const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SuperAdmin = require('../models/SuperAdmin');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if this is a superadmin token
    if (decoded.isSuperAdmin) {
      const admin = await SuperAdmin.findById(decoded.id).select('-password');
      if (!admin || admin.status !== 'active') {
        return res.status(401).json({ error: 'Super admin not found or inactive.' });
      }
      req.user = admin;
      req.isSuperAdmin = true;
      return next();
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    req.user = user;
    req.isSuperAdmin = false;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.isSuperAdmin) return next(); // superadmin bypasses all role checks
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to access this resource.' });
    }
    next();
  };
};

const superAdminOnly = (req, res, next) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access only.' });
  }
  next();
};

module.exports = { auth, authorize, superAdminOnly };

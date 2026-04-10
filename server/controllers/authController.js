const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const Organization = require('../models/Organization');
const SuperAdmin = require('../models/SuperAdmin');

const generateToken = (id, isSuperAdmin = false) => {
  return jwt.sign({ id, isSuperAdmin }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Generate employee ID scoped to organization
const generateEmployeeId = async (orgId) => {
  const count = await User.countDocuments({ organization: orgId });
  return `EMP${String(count + 1).padStart(4, '0')}`;
};

exports.loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.registerValidation = [
  body('orgName').trim().notEmpty().withMessage('Organization name is required'),
  body('name').trim().notEmpty().withMessage('Admin name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.register = async (req, res) => {
  const session = await require('mongoose').startSession();
  session.startTransaction();

  try {
    const { orgName, name, email, password, phone, industry, employeeCount } = req.body;

    // Check if organization name already exists
    const existingOrg = await Organization.findOne({ name: { $regex: new RegExp(`^${orgName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    if (existingOrg) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'An organization with this name already exists. Please choose a different name.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create slug from org name
    const baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await Organization.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create organization
    const org = new Organization({
      name: orgName,
      slug,
      email,
      phone,
      industry,
      employeeCount: employeeCount || '1-10',
    });
    await org.save({ session });

    // Create admin user (HR role)
    const employeeId = 'EMP0001';
    const user = new User({
      employeeId,
      name,
      email,
      password,
      phone,
      role: 'hr',
      organization: org._id,
    });
    await user.save({ session });

    // Update org with creator
    org.createdBy = user._id;
    await org.save({ session });

    await session.commitTransaction();
    session.endSession();

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: user.toJSON(),
      organization: org,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .populate('organization', 'name slug logo isActive')
      .populate('department', 'name code')
      .populate('designation', 'name code level');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is deactivated. Contact HR.' });
    }

    if (user.organization && !user.organization.isActive) {
      return res.status(403).json({ error: 'Organization account is suspended.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('organization', 'name slug logo settings')
      .populate('department', 'name code')
      .populate('designation', 'name code level');
    
    const userData = user.toJSON();
    // Generate signed URL for profile picture if exists
    if (user.profilePicture?.gcsPath) {
      const { getSignedUrl } = require('../utils/gcpStorage');
      userData.profilePicture = {
        ...user.profilePicture.toObject ? user.profilePicture.toObject() : user.profilePicture,
        url: await getSignedUrl(user.profilePicture.gcsPath),
      };
    }
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update own profile (phone, address)
exports.updateProfile = async (req, res) => {
  try {
    const { phone, address } = req.body;

    const updateData = {};
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).populate('organization', 'name slug logo settings')
     .populate('department', 'name code')
     .populate('designation', 'name code level');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user.toJSON();
    // Generate signed URL for profile picture if exists
    if (user.profilePicture?.gcsPath) {
      const { getSignedUrl } = require('../utils/gcpStorage');
      userData.profilePicture = {
        ...user.profilePicture.toObject ? user.profilePicture.toObject() : user.profilePicture,
        url: await getSignedUrl(user.profilePicture.gcsPath),
      };
    }

    res.json(userData);
  } catch (error) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

exports.generateEmployeeId = generateEmployeeId;

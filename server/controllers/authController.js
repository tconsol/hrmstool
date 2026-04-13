const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body } = require('express-validator');
const User = require('../models/User');
const Organization = require('../models/Organization');
const SuperAdmin = require('../models/SuperAdmin');
const { sendOTPEmail, sendPasswordResetEmail, sendUsernameReminderEmail } = require('../utils/email');

const generateToken = (id, isSuperAdmin = false) => {
  return jwt.sign({ id, isSuperAdmin }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Generate a 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Generate org ID: first 2 letters of each word + 4-digit random number (unique)
const generateOrgId = async (orgName) => {
  const words = orgName.trim().split(/\s+/);
  const prefix = words
    .map(w => w.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2))
    .join('')
    .toUpperCase();

  let orgId, exists;
  do {
    const randomNum = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    orgId = `${prefix}${randomNum}`;
    exists = await Organization.findOne({ orgId });
  } while (exists);

  return orgId;
};

// Get employee ID prefix from org name (first 4 alphanumeric chars, uppercase)
const getEmployeeIdPrefix = (orgName) => {
  return orgName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
};

// Generate employee ID scoped to organization (TCONEMP0001 format)
const generateEmployeeId = async (orgMongoId) => {
  const org = await Organization.findById(orgMongoId);
  const prefix = org?.employeeIdPrefix || getEmployeeIdPrefix(org?.name || 'EMP');
  const count = await User.countDocuments({ organization: orgMongoId });
  return `${prefix}EMP${String(count + 1).padStart(4, '0')}`;
};

exports.generateEmployeeId = generateEmployeeId;

exports.loginValidation = [
  body('email').trim().notEmpty().withMessage('Email or Employee ID is required'),
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
    const { orgName, name, email, password, phone, industry, employeeCount, customOrgId } = req.body;

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

    // Resolve orgId (custom or auto-generated)
    let orgId;
    if (customOrgId && customOrgId.trim()) {
      const normalized = customOrgId.trim().replace(/\s+/g, '').toUpperCase();
      if (!/^[A-Z0-9]{4,20}$/.test(normalized)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Organization ID must be 4–20 alphanumeric characters.' });
      }
      const takenOrgId = await Organization.findOne({ orgId: normalized });
      if (takenOrgId) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Organization ID already taken. Please choose a different one.' });
      }
      orgId = normalized;
    } else {
      orgId = await generateOrgId(orgName);
    }

    // Employee ID prefix (first 4 alphanumeric chars of org name)
    const empPrefix = getEmployeeIdPrefix(orgName);

    // Create slug from org name
    const baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await Organization.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create organization (inactive, pending OTP verification)
    const org = new Organization({
      name: orgName,
      orgId,
      employeeIdPrefix: empPrefix,
      slug,
      email,
      phone,
      industry,
      employeeCount: employeeCount || '1-10',
      isActive: false,
      isVerified: false,
      verificationStatus: 'pending_otp',
      otp: { code: otp, expiresAt: otpExpiry },
    });
    await org.save({ session });

    // Create admin user (CEO role) with org-prefixed employee ID
    const employeeId = `${empPrefix}EMP0001`;
    const user = new User({
      employeeId,
      name,
      email,
      password,
      phone,
      role: 'ceo',
      organization: org._id,
    });
    await user.save({ session });

    // Update org with creator
    org.createdBy = user._id;
    await org.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, orgName);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
    }

    res.status(201).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      organizationId: org._id,
      email,
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

    // Normalize input: email to lowercase, employee ID to uppercase
    const isEmail = email.includes('@');
    const normalizedInput = isEmail ? email.toLowerCase() : email.toUpperCase();

    // Support login by email or employee ID
    const user = await User.findOne({
      $or: [{ email: normalizedInput }, { employeeId: normalizedInput }]
    })
      .populate('organization', 'name slug logo isActive isVerified verificationStatus enabledFeatures')
      .populate('department', 'name code')
      .populate('designation', 'name code level');

    let userFound = false;
    let passwordMatch = false;

    if (user) {
      userFound = true;
      passwordMatch = await user.comparePassword(password);
    }

    // Return specific errors based on what failed
    if (!userFound) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password', code: 'PASSWORD_INCORRECT' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is deactivated. Contact your CEO.' });
    }

    // Check organization verification/activation status
    if (user.organization) {
      if (user.organization.verificationStatus === 'pending_otp') {
        return res.status(403).json({ error: 'Your organization email is not yet verified. Please complete the OTP verification first.' });
      }
      if (user.organization.verificationStatus === 'pending_approval') {
        return res.status(403).json({ error: 'Your organization profile is currently under review. Our team will verify and activate your account shortly.' });
      }
      if (user.organization.verificationStatus === 'rejected') {
        return res.status(403).json({ error: 'Your organization registration has been rejected. Please contact support.' });
      }
      if (!user.organization.isActive) {
        return res.status(403).json({ error: 'Your organization profile is currently under review. Our team will verify and activate your account shortly.' });
      }
    }

    const token = generateToken(user._id);
    const userData = user.toJSON();
    
    // Generate signed URL for profile picture if exists
    if (user.profilePicture?.gcsPath) {
      const { getSignedUrl } = require('../utils/gcpStorage');
      try {
        userData.profilePicture = {
          ...user.profilePicture.toObject ? user.profilePicture.toObject() : user.profilePicture,
          url: await getSignedUrl(user.profilePicture.gcsPath),
        };
      } catch (err) {
        console.error('Failed to generate signed URL for profile picture:', err);
        if (userData.profilePicture) userData.profilePicture.url = null;
      }
    }

    res.json({
      token,
      user: userData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('organization', 'name slug logo settings enabledFeatures')
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
      console.log('✅ Profile picture found on login:', { userId: req.user._id, gcsPath: user.profilePicture.gcsPath });
    } else {
      console.log('⚠️  No profile picture found on login:', { userId: req.user._id });
    }
    res.json(userData);
  } catch (error) {
    console.error('❌ Error in getMe:', error);
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

// Update own profile (personal details)
exports.updateProfile = async (req, res) => {
  try {
    const {
      phone, address, email,
      fatherName, fatherDateOfBirth, motherName, motherDateOfBirth, parentAddress,
      dateOfBirth, bloodGroup, healthIssues,
      nomineeName, nomineeRelationship,
      contactName, contactPhone, emergencyRelationship,
      aadhaarNumber, panNumber,
      bankName, bankAccountNumber, accountType, branchAddress, ifscCode, uan
    } = req.body;

    const updateData = {};
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (email !== undefined) updateData.email = email;
    if (fatherName !== undefined) updateData.fatherName = fatherName;
    if (fatherDateOfBirth !== undefined) updateData.fatherDateOfBirth = fatherDateOfBirth;
    if (motherName !== undefined) updateData.motherName = motherName;
    if (motherDateOfBirth !== undefined) updateData.motherDateOfBirth = motherDateOfBirth;
    if (parentAddress !== undefined) updateData.parentAddress = parentAddress;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    if (healthIssues !== undefined) updateData.healthIssues = healthIssues;
    if (nomineeName !== undefined) updateData.nomineeName = nomineeName;
    if (nomineeRelationship !== undefined) updateData.nomineeRelationship = nomineeRelationship;
    if (aadhaarNumber !== undefined) updateData.aadhaarNumber = aadhaarNumber;
    if (panNumber !== undefined) updateData.panNumber = panNumber;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
    if (accountType !== undefined) updateData.accountType = accountType;
    if (branchAddress !== undefined) updateData.branchAddress = branchAddress;
    if (ifscCode !== undefined) updateData.ifscCode = ifscCode;
    if (uan !== undefined) updateData.uan = uan;
    
    // Emergency contact fields
    if (contactName !== undefined || contactPhone !== undefined || emergencyRelationship !== undefined) {
      updateData.emergencyContact = {
        name: contactName || req.user.emergencyContact?.name || '',
        phone: contactPhone || req.user.emergencyContact?.phone || '',
        relationship: emergencyRelationship || req.user.emergencyContact?.relationship || '',
      };
    }

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
      console.log('✅ Profile picture preserved after update:', { userId: req.user._id, gcsPath: user.profilePicture.gcsPath });
    }

    res.json(userData);
  } catch (error) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ==================== OTP VERIFICATION ====================

exports.verifyOTP = async (req, res) => {
  try {
    const { organizationId, otp } = req.body;

    if (!organizationId || !otp) {
      return res.status(400).json({ error: 'Organization ID and OTP are required' });
    }

    const org = await Organization.findById(organizationId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (org.isVerified) {
      return res.status(400).json({ error: 'Organization is already verified' });
    }

    if (!org.otp || !org.otp.code) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    if (new Date() > new Date(org.otp.expiresAt)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (org.otp.code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    // Mark as verified and pending approval
    org.isVerified = true;
    org.verificationStatus = 'pending_approval';
    org.otp = undefined;
    await org.save();

    res.json({
      message: 'Email verified successfully! Your organization is now under review. Our team will verify your details and activate your account shortly. You will receive a confirmation email once activated.',
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Server error during OTP verification' });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { organizationId } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const org = await Organization.findById(organizationId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (org.isVerified) {
      return res.status(400).json({ error: 'Organization is already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    org.otp = { code: otp, expiresAt: otpExpiry };
    await org.save();

    // Send OTP email
    try {
      await sendOTPEmail(org.email, otp, org.name);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
    }

    res.json({ message: 'New OTP sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== FORGOT PASSWORD ====================

exports.forgotPassword = async (req, res) => {
  try {
    const { email, userType } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let account;
    let name;

    if (userType === 'superadmin') {
      account = await SuperAdmin.findOne({ email });
      name = account?.name;
    } else {
      account = await User.findOne({ email });
      name = account?.name;
    }

    if (!account) {
      // Don't reveal whether the email exists
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    account.resetPasswordToken = resetTokenHash;
    account.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await account.save();

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken, name);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      account.resetPasswordToken = undefined;
      account.resetPasswordExpires = undefined;
      await account.save();
      return res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
    }

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, userType } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    let account;
    if (userType === 'superadmin') {
      account = await SuperAdmin.findOne({
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: { $gt: Date.now() },
      });
    } else {
      account = await User.findOne({
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: { $gt: Date.now() },
      });
    }

    if (!account) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    account.password = newPassword;
    account.resetPasswordToken = undefined;
    account.resetPasswordExpires = undefined;
    await account.save();

    res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== FORGOT USERNAME ====================

exports.forgotUsername = async (req, res) => {
  try {
    const { name, phone, userType } = req.body;

    if (!name && !phone) {
      return res.status(400).json({ error: 'Please provide your name or phone number' });
    }

    let query = {};
    if (name && phone) {
      query = { name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, phone };
    } else if (name) {
      query = { name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } };
    } else {
      query = { phone };
    }

    let account;
    if (userType === 'superadmin') {
      account = await SuperAdmin.findOne(query);
    } else {
      account = await User.findOne(query);
    }

    if (!account) {
      return res.json({ message: 'If a matching account is found, a reminder email will be sent.' });
    }

    // Send username reminder email
    try {
      await sendUsernameReminderEmail(account.email, account.name, account.email);
    } catch (emailError) {
      console.error('Failed to send username reminder:', emailError);
    }

    res.json({ message: 'If a matching account is found, a reminder email has been sent to the registered email address.' });
  } catch (error) {
    console.error('Forgot username error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

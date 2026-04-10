const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const SuperAdmin = require('../models/SuperAdmin');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Payroll = require('../models/Payroll');
const { FEATURES, ALL_FEATURE_KEYS, DEFAULT_FEATURES } = require('../config/features');
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/email');

const generateToken = (id) => {
  return jwt.sign({ id, isSuperAdmin: true }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ==================== AUTH ====================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await SuperAdmin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (admin.status !== 'active') {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id);
    res.json({
      token,
      user: { ...admin.toJSON(), role: 'superadmin' },
    });
  } catch (error) {
    console.error('SuperAdmin login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const admin = await SuperAdmin.findById(req.user._id);
    res.json({ ...admin.toJSON(), role: 'superadmin' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await SuperAdmin.findById(req.user._id);

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const admin = await SuperAdmin.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    );
    res.json({ ...admin.toJSON(), role: 'superadmin' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== DASHBOARD ====================

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalOrgs,
      activeOrgs,
      suspendedOrgs,
      pendingOrgs,
      totalUsers,
      activeUsers,
    ] = await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ isActive: true, verificationStatus: 'approved' }),
      Organization.countDocuments({ isActive: false, verificationStatus: { $nin: ['pending_otp', 'pending_approval'] } }),
      Organization.countDocuments({ verificationStatus: 'pending_approval' }),
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
    ]);

    // Revenue from subscriptions
    const orgs = await Organization.find({}, 'subscription createdAt name');

    const planPricing = {
      free: 0,
      starter: 999,
      professional: 2999,
      enterprise: 9999,
    };

    let monthlyRevenue = 0;
    let annualRevenue = 0;
    const planDistribution = { free: 0, starter: 0, professional: 0, enterprise: 0 };

    orgs.forEach(org => {
      const plan = org.subscription?.plan || 'free';
      const price = planPricing[plan] || 0;
      monthlyRevenue += price;
      planDistribution[plan] = (planDistribution[plan] || 0) + 1;
    });

    annualRevenue = monthlyRevenue * 12;

    // Recent orgs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrgs = await Organization.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Monthly growth - orgs created in last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyGrowth = await Organization.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      organizations: {
        total: totalOrgs,
        active: activeOrgs,
        suspended: suspendedOrgs,
        pendingApproval: pendingOrgs,
        recentSignups: recentOrgs,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      revenue: {
        monthly: monthlyRevenue,
        annual: annualRevenue,
        currency: 'INR',
      },
      planDistribution,
      monthlyGrowth,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== ORGANIZATIONS ====================

exports.getAllOrganizations = async (req, res) => {
  try {
    const { search, status, plan, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status === 'active') filter.isActive = true;
    if (status === 'suspended') filter.isActive = false;
    if (plan) filter['subscription.plan'] = plan;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [organizations, total] = await Promise.all([
      Organization.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Organization.countDocuments(filter),
    ]);

    // Get employee count for each org
    const orgIds = organizations.map(o => o._id);
    const employeeCounts = await User.aggregate([
      { $match: { organization: { $in: orgIds } } },
      { $group: { _id: '$organization', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    employeeCounts.forEach(ec => {
      countMap[ec._id.toString()] = ec.count;
    });

    const orgsWithCounts = organizations.map(org => ({
      ...org.toJSON(),
      actualEmployeeCount: countMap[org._id.toString()] || 0,
    }));

    res.json({
      organizations: orgsWithCounts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getOrganizationDetails = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const [employeeCount, departmentCount, recentUsers] = await Promise.all([
      User.countDocuments({ organization: org._id }),
      require('../models/Department').countDocuments({ organization: org._id }),
      User.find({ organization: org._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role status department designation createdAt')
        .populate('department', 'name')
        .populate('designation', 'name code'),
    ]);

    const roleDistribution = await User.aggregate([
      { $match: { organization: org._id } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    res.json({
      organization: org,
      stats: {
        employeeCount,
        departmentCount,
        roleDistribution,
      },
      recentUsers,
    });
  } catch (error) {
    console.error('Org details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.toggleOrganizationStatus = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const wasActive = org.isActive;
    org.isActive = !org.isActive;

    // If activating for the first time (from pending_approval), update verification status
    if (org.isActive && org.verificationStatus === 'pending_approval') {
      org.verificationStatus = 'approved';
    }

    await org.save();

    // Send activation confirmation email when organization is activated
    if (!wasActive && org.isActive) {
      try {
        await sendActivationEmail(org.email, org.name);
        console.log(`Activation email sent to ${org.email}`);
      } catch (emailError) {
        console.error('Failed to send activation email:', emailError);
      }
    }

    res.json({
      message: `Organization ${org.isActive ? 'activated' : 'suspended'} successfully`,
      organization: org,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const { plan, maxEmployees, endDate } = req.body;

    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (plan) org.subscription.plan = plan;
    if (typeof maxEmployees !== 'undefined') org.subscription.maxEmployees = maxEmployees;
    if (endDate) org.subscription.endDate = new Date(endDate);

    await org.save();

    res.json({
      message: 'Subscription updated successfully',
      organization: org,
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Delete all org data
    const orgId = org._id;
    await Promise.all([
      User.deleteMany({ organization: orgId }),
      require('../models/Department').deleteMany({ organization: orgId }),
      require('../models/Attendance').deleteMany({ organization: orgId }),
      require('../models/Leave').deleteMany({ organization: orgId }),
      Payroll.deleteMany({ organization: orgId }),
      require('../models/Holiday').deleteMany({ organization: orgId }),
      require('../models/Announcement').deleteMany({ organization: orgId }),
      require('../models/Shift').deleteMany({ organization: orgId }),
      require('../models/Asset').deleteMany({ organization: orgId }),
      require('../models/Training').deleteMany({ organization: orgId }),
      require('../models/Expense').deleteMany({ organization: orgId }),
      Organization.findByIdAndDelete(orgId),
    ]);

    res.json({ message: 'Organization and all related data deleted successfully' });
  } catch (error) {
    console.error('Delete org error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== REVENUE ====================

exports.getRevenueReport = async (req, res) => {
  try {
    const orgs = await Organization.find({}, 'name subscription isActive createdAt');

    const planPricing = {
      free: 0,
      starter: 999,
      professional: 2999,
      enterprise: 9999,
    };

    let totalMonthlyRevenue = 0;
    const revenueByPlan = {};
    const orgRevenue = [];

    orgs.forEach(org => {
      const plan = org.subscription?.plan || 'free';
      const price = planPricing[plan] || 0;
      totalMonthlyRevenue += price;

      revenueByPlan[plan] = (revenueByPlan[plan] || 0) + price;

      orgRevenue.push({
        _id: org._id,
        name: org.name,
        plan,
        monthlyAmount: price,
        isActive: org.isActive,
        subscriptionEnd: org.subscription?.endDate,
      });
    });

    // Expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoon = orgs.filter(
      o => o.subscription?.endDate && new Date(o.subscription.endDate) <= thirtyDaysFromNow
    ).length;

    res.json({
      summary: {
        totalMonthlyRevenue,
        totalAnnualRevenue: totalMonthlyRevenue * 12,
        totalOrganizations: orgs.length,
        paidOrganizations: orgs.filter(o => (o.subscription?.plan || 'free') !== 'free').length,
        expiringSoon,
      },
      revenueByPlan,
      organizations: orgRevenue,
    });
  } catch (error) {
    console.error('Revenue report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== SYSTEM SETTINGS ====================

exports.getSystemSettings = async (req, res) => {
  try {
    // Platform-level settings (can be stored in a separate collection
    // but for now we return sensible defaults)
    res.json({
      platform: {
        name: 'HRMS Platform',
        maintenanceMode: false,
        registrationEnabled: true,
        maxOrganizations: 1000,
        defaultPlan: 'free',
      },
      plans: {
        free: { price: 0, maxEmployees: 10, features: ['Basic HR', 'Attendance'] },
        starter: { price: 999, maxEmployees: 50, features: ['Basic HR', 'Attendance', 'Payroll', 'Leaves'] },
        professional: { price: 2999, maxEmployees: 200, features: ['All Features', 'Priority Support'] },
        enterprise: { price: 9999, maxEmployees: 1000, features: ['All Features', 'Dedicated Support', 'Custom Integrations'] },
      },
      pricing: {
        currency: 'INR',
        billingCycle: 'monthly',
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== AUDIT LOG ====================

exports.getAuditLog = async (req, res) => {
  try {
    // Recent org changes as audit trail
    const recentOrgs = await Organization.find()
      .sort({ updatedAt: -1 })
      .limit(50)
      .select('name isActive subscription updatedAt createdAt');

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('name email role organization status department designation createdAt')
      .populate('organization', 'name')
      .populate('department', 'name')
      .populate('designation', 'name code')
      .populate('organization', 'name');

    res.json({
      recentOrganizationChanges: recentOrgs,
      recentUserRegistrations: recentUsers,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== FEATURE MANAGEMENT ====================

exports.getFeatureList = async (req, res) => {
  try {
    res.json({ features: FEATURES, defaults: DEFAULT_FEATURES });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getOrganizationFeatures = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id).select('name enabledFeatures');
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json({ organization: org.name, enabledFeatures: org.enabledFeatures });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateOrganizationFeatures = async (req, res) => {
  try {
    const { enabledFeatures } = req.body;
    if (!Array.isArray(enabledFeatures)) {
      return res.status(400).json({ error: 'enabledFeatures must be an array' });
    }

    // Validate all feature keys
    const invalid = enabledFeatures.filter(f => !ALL_FEATURE_KEYS.includes(f));
    if (invalid.length > 0) {
      return res.status(400).json({ error: `Invalid feature keys: ${invalid.join(', ')}` });
    }

    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    org.enabledFeatures = enabledFeatures;
    await org.save();

    res.json({
      message: 'Organization features updated successfully',
      enabledFeatures: org.enabledFeatures,
    });
  } catch (error) {
    console.error('Update org features error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== PENDING ORGANIZATIONS ====================

exports.getPendingOrganizations = async (req, res) => {
  try {
    const pendingOrgs = await Organization.find({ verificationStatus: 'pending_approval' })
      .sort({ createdAt: -1 });

    // Get creator info for each pending org
    const orgIds = pendingOrgs.map(o => o._id);
    const creators = await User.find({ organization: { $in: orgIds }, role: 'ceo' })
      .select('name email phone organization');

    const creatorMap = {};
    creators.forEach(c => {
      creatorMap[c.organization.toString()] = { name: c.name, email: c.email, phone: c.phone };
    });

    const orgsWithCreators = pendingOrgs.map(org => ({
      ...org.toJSON(),
      creator: creatorMap[org._id.toString()] || null,
    }));

    res.json({ organizations: orgsWithCreators });
  } catch (error) {
    console.error('Get pending orgs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.approveOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (org.verificationStatus !== 'pending_approval') {
      return res.status(400).json({ error: 'Organization is not pending approval' });
    }

    org.isActive = true;
    org.verificationStatus = 'approved';
    await org.save();

    // Send activation email
    try {
      await sendActivationEmail(org.email, org.name);
      console.log(`Activation email sent to ${org.email}`);
    } catch (emailError) {
      console.error('Failed to send activation email:', emailError);
    }

    res.json({
      message: 'Organization approved and activated successfully',
      organization: org,
    });
  } catch (error) {
    console.error('Approve org error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.rejectOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    org.verificationStatus = 'rejected';
    org.isActive = false;
    await org.save();

    res.json({
      message: 'Organization rejected',
      organization: org,
    });
  } catch (error) {
    console.error('Reject org error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== SUPER ADMIN FORGOT PASSWORD ====================

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const admin = await SuperAdmin.findOne({ email });
    if (!admin) {
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    admin.resetPasswordToken = resetTokenHash;
    admin.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await admin.save();

    try {
      await sendPasswordResetEmail(email, resetToken, admin.name);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      admin.resetPasswordToken = undefined;
      admin.resetPasswordExpires = undefined;
      await admin.save();
      return res.status(500).json({ error: 'Failed to send reset email.' });
    }

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Super admin forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Payroll = require('../models/Payroll');

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
      totalUsers,
      activeUsers,
    ] = await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ isActive: true }),
      Organization.countDocuments({ isActive: false }),
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
        .select('name email role status createdAt'),
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

    org.isActive = !org.isActive;
    await org.save();

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
    if (maxEmployees) org.subscription.maxEmployees = maxEmployees;
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
      .select('name email role organization status createdAt')
      .populate('organization', 'name');

    res.json({
      recentOrganizationChanges: recentOrgs,
      recentUserRegistrations: recentUsers,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

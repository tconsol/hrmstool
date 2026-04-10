const Organization = require('../models/Organization');

/**
 * Middleware factory: checks that the organization has a specific feature enabled.
 * Usage:  router.get('/payroll', requireFeature('payroll'), ctrl.getPayroll);
 *
 * Must be used AFTER auth + orgScope middleware (needs req.orgId).
 */
const requireFeature = (...featureKeys) => {
  return async (req, res, next) => {
    try {
      // Super admins bypass feature checks
      if (req.isSuperAdmin) return next();

      const org = await Organization.findById(req.orgId).select('enabledFeatures').lean();
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      const enabled = org.enabledFeatures || [];
      const missing = featureKeys.filter(k => !enabled.includes(k));

      if (missing.length > 0) {
        return res.status(403).json({
          error: 'Feature not available',
          message: `The following features are not enabled for your organization: ${missing.join(', ')}. Contact your administrator.`,
          missingFeatures: missing,
        });
      }

      next();
    } catch (error) {
      console.error('requireFeature middleware error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
};

module.exports = requireFeature;

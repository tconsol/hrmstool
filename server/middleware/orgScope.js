/**
 * Organization scope middleware.
 * Must be used AFTER auth middleware.
 * Sets req.orgId from the authenticated user's organization.
 */
const orgScope = (req, res, next) => {
  if (!req.user || !req.user.organization) {
    return res.status(403).json({ error: 'No organization associated with this account.' });
  }
  req.orgId = req.user.organization;
  next();
};

module.exports = orgScope;

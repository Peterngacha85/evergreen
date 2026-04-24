// Only superadmin can access
const superAdminOnly = (req, res, next) => {
  if (req.role === 'superadmin') return next();
  return res.status(403).json({ message: 'Access denied: Superadmin only' });
};

// Leaders and superadmin
const leaderOrSuperAdmin = (req, res, next) => {
  if (req.role === 'leader' || req.role === 'superadmin') return next();
  return res.status(403).json({ message: 'Access denied: Leaders only' });
};

// Any authenticated user
const anyUser = (req, res, next) => {
  if (req.role) return next();
  return res.status(403).json({ message: 'Access denied' });
};

module.exports = { superAdminOnly, leaderOrSuperAdmin, anyUser };

const ChangeRequest = require('../models/ChangeRequest');

// Middleware: ensure the leader has an active approved change request session
// Use this on any write route (POST/PUT/PATCH/DELETE) for leaders
const requireApprovedSession = async (req, res, next) => {
  // SuperAdmin bypasses this check
  if (req.role === 'superadmin') return next();

  try {
    const activeRequest = await ChangeRequest.findOne({
      requestedBy: req.user._id,
      status: 'approved',
      expiresAt: { $gt: new Date() },
    });

    if (!activeRequest) {
      return res.status(403).json({
        message:
          'Action denied: You need an approved change request session. Submit a request and have all other leaders approve it.',
      });
    }

    // Attach the active session to request for reference
    req.activeChangeRequest = activeRequest;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { requireApprovedSession };

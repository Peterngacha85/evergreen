const jwt = require('jsonwebtoken');
const Member = require('../models/Member');
const Leader = require('../models/Leader');
const { deactivationNotice } = require('../utils/campaignStatus');

// Protect routes - verify JWT
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role === 'member') {
        req.user = await Member.findById(decoded.id).select('-password');
        req.role = 'member';
      } else if (decoded.role === 'leader') {
        req.user = await Leader.findById(decoded.id).select('-password');
        req.role = 'leader';
      } else if (decoded.role === 'superadmin') {
        req.user = await Leader.findById(decoded.id).select('-password');
        req.role = 'superadmin';
      }

      if (!req.user) return res.status(401).json({ message: 'User not found' });

      // A member deactivated while logged in loses access straight away
      if (req.role === 'member' && req.user.isDeactivated) {
        return res.status(403).json(deactivationNotice(req.user));
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };

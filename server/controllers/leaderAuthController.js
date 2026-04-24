const Leader = require('../models/Leader');
const generateToken = require('../utils/generateToken');

// @desc  Leader login (ID Number + Phone + Password)
// @route POST /api/auth/leader/login
// @access Public
const leaderLogin = async (req, res) => {
  try {
    const { idNumber, phoneNumber, password } = req.body;

    if (!idNumber || !phoneNumber || !password)
      return res.status(400).json({ message: 'ID number, phone number, and password are required' });

    const leader = await Leader.findOne({ idNumber, phoneNumber, isActive: true }).select('+password');
    if (!leader) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await leader.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(leader._id, 'leader');

    res.json({
      token,
      user: {
        _id: leader._id,
        name: leader.name,
        idNumber: leader.idNumber,
        phoneNumber: leader.phoneNumber,
        leaderRole: leader.leaderRole,
        profilePhoto: leader.profilePhoto,
        role: 'leader',
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Super Admin login (email + password from .env)
// @route POST /api/auth/superadmin/login
// @access Public
const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email !== process.env.SUPER_ADMIN_EMAIL ||
      password !== process.env.SUPER_ADMIN_PASSWORD
    ) {
      return res.status(401).json({ message: 'Invalid superadmin credentials' });
    }

    const token = generateToken('superadmin', 'superadmin');

    res.json({
      token,
      user: {
        id: 'superadmin',
        email: process.env.SUPER_ADMIN_EMAIL,
        role: 'superadmin',
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { leaderLogin, superAdminLogin };

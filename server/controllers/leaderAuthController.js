const jwt = require('jsonwebtoken');
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

    // Ensure superadmin exists in DB for profile photo updates
    let superAdminRecord = await Leader.findOne({ email: process.env.SUPER_ADMIN_EMAIL });
    
    if (!superAdminRecord) {
      // Fallback: search by idNumber in case it was created without an email field previously
      superAdminRecord = await Leader.findOne({ idNumber: '00000000' });
      
      if (superAdminRecord) {
        // Update existing record with the email and role
        superAdminRecord.email = process.env.SUPER_ADMIN_EMAIL;
        superAdminRecord.role = 'superadmin';
        await superAdminRecord.save();
      } else {
        // Create new record
        superAdminRecord = await Leader.create({
          name: 'Super Admin',
          email: process.env.SUPER_ADMIN_EMAIL,
          password: process.env.SUPER_ADMIN_PASSWORD,
          phoneNumber: '0000000000',
          idNumber: '00000000',
          leaderRole: 'Chairman',
          role: 'superadmin'
        });
      }
    }

    const token = generateToken(superAdminRecord._id, 'superadmin');

    res.json({
      token,
      user: {
        _id: superAdminRecord._id,
        name: superAdminRecord.name,
        email: superAdminRecord.email,
        profilePhoto: superAdminRecord.profilePhoto,
        role: 'superadmin',
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update leader profile (photo only for now)
// @route PUT /api/auth/leader/profile
// @access Private
const updateLeaderProfile = async (req, res) => {
  try {
    const leaderId = req.user._id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const leader = await Leader.findById(leaderId);
    if (!leader) return res.status(404).json({ message: 'Leader not found' });

    leader.profilePhoto = {
      url: req.file.path,
      publicId: req.file.filename
    };

    await leader.save();

    res.json({
      message: 'Profile updated successfully',
      profilePhoto: leader.profilePhoto
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { leaderLogin, superAdminLogin, updateLeaderProfile };

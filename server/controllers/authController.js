const Member = require('../models/Member');
const Leader = require('../models/Leader');
const generateToken = require('../utils/generateToken');

// @desc  Member login (ID Number + Password)
// @route POST /api/auth/member/login
// @access Public
const memberLogin = async (req, res) => {
  try {
    const { idNumber, password } = req.body;

    if (!idNumber || !password)
      return res.status(400).json({ message: 'ID number and password are required' });

    const member = await Member.findOne({ idNumber, isActive: true }).select('+password');
    if (!member) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await member.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Check if this member is also a leader
    const leader = await Leader.findOne({ idNumber, isActive: true });
    const userRole = leader ? 'leader' : 'member';
    
    // If they are a leader, we use the leader ID for the token so the leader middleware works
    const userId = leader ? leader._id : member._id;
    const token = generateToken(userId, userRole);

    res.json({
      token,
      user: {
        _id: userId,
        name: member.name,
        idNumber: member.idNumber,
        phoneNumber: member.phoneNumber,
        profilePhoto: member.profilePhoto,
        role: userRole,
        leaderRole: leader?.leaderRole || null,
        joinDate: member.joinDate,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update member password
// @route PUT /api/auth/member/password
// @access Private (Member)
const updateMemberPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const member = await Member.findById(req.user._id).select('+password');

    if (!member) return res.status(404).json({ message: 'Member not found' });

    const isMatch = await member.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    member.password = newPassword;
    member.plainPassword = newPassword;
    await member.save();

    // Sync with Leader record if it exists
    const leader = await Leader.findOne({ idNumber: member.idNumber });
    if (leader) {
      leader.password = newPassword;
      await leader.save();
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { memberLogin, updateMemberPassword };

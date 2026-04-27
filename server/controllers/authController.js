const Member = require('../models/Member');
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

    const token = generateToken(member._id, 'member');

    res.json({
      token,
      user: {
        _id: member._id,
        name: member.name,
        idNumber: member.idNumber,
        phoneNumber: member.phoneNumber,
        profilePhoto: member.profilePhoto,
        role: 'member',
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
    member.plainPassword = newPassword; // Store the plain text password as requested
    await member.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { memberLogin, updateMemberPassword };

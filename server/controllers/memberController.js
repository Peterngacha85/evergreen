const Member = require('../models/Member');
const cloudinary = require('../config/cloudinary');

// @desc  Get all members
// @route GET /api/members
// @access Leader + SuperAdmin
const getAllMembers = async (req, res) => {
  try {
    const members = await Member.find({ isActive: true })
      .select('-password')
      .populate('addedBy', 'name leaderRole')
      .sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get single member (leaders can view, member can view self)
// @route GET /api/members/:id
// @access Leader + Member (self)
const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).select('-password').populate('addedBy', 'name leaderRole');
    if (!member) return res.status(404).json({ message: 'Member not found' });

    // Members can only see themselves
    if (req.role === 'member' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Register a new member
// @route POST /api/members
// @access Leader + SuperAdmin (requires approved changeRequest for leaders)
const createMember = async (req, res) => {
  try {
    const { name, idNumber, phoneNumber, password } = req.body;

    if (!name || !idNumber || !phoneNumber || !password)
      return res.status(400).json({ message: 'Name, ID number, phone and password are required' });

    const existing = await Member.findOne({ idNumber });
    if (existing) return res.status(400).json({ message: 'Member with this ID already exists' });

    let profilePhoto = { url: '', publicId: '' };
    if (req.file) {
      profilePhoto = { url: req.file.path, publicId: req.file.filename };
    }

    const addedBy = req.role === 'leader' ? req.user._id : null;

    const member = await Member.create({
      name, idNumber, phoneNumber, password, profilePhoto, addedBy,
    });

    res.status(201).json({
      _id: member._id,
      name: member.name,
      idNumber: member.idNumber,
      phoneNumber: member.phoneNumber,
      profilePhoto: member.profilePhoto,
      joinDate: member.joinDate,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update member profile photo (member self-service)
// @route PATCH /api/members/:id/photo
// @access Member (self only)
const updateMemberPhoto = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'You can only update your own photo' });
    }

    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    if (member.profilePhoto && member.profilePhoto.publicId) {
      await cloudinary.uploader.destroy(member.profilePhoto.publicId);
    }

    member.profilePhoto = { url: req.file.path, publicId: req.file.filename };
    await member.save();

    res.json({ message: 'Profile photo updated', profilePhoto: member.profilePhoto });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update member details (name, phone, password) - leaders only
// @route PUT /api/members/:id
// @access Leader + SuperAdmin
const updateMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    const { name, phoneNumber, password } = req.body;
    if (name) member.name = name;
    if (phoneNumber) member.phoneNumber = phoneNumber;
    if (password) member.password = password;

    const updated = await member.save();
    res.json({ message: 'Member updated', member: { _id: updated._id, name: updated.name } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Deactivate member
// @route DELETE /api/members/:id
// @access Leader + SuperAdmin
const deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    member.isActive = false;
    await member.save();
    res.json({ message: 'Member deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get member's own profile
// @route GET /api/members/me
// @access Member
const getMyProfile = async (req, res) => {
  try {
    const member = await Member.findById(req.user._id).select('-password');
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllMembers, getMemberById, createMember, updateMemberPhoto, updateMember, deleteMember, getMyProfile };

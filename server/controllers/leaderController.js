const Leader = require('../models/Leader');
const Member = require('../models/Member');
const cloudinary = require('../config/cloudinary');

// @desc  Get all leaders (public-facing, for the Officials page)
// @route GET /api/leaders
// @access Member + Leader + SuperAdmin
const getAllLeaders = async (req, res) => {
  try {
    const query = Leader.find({ isActive: true, role: 'leader', idNumber: { $ne: '00000000' } });
    if (req.role !== 'superadmin') query.select('-password');
    const leaders = await query;
    // Sort by order number (lower numbers first), then alphabetically by role
    leaders.sort((a, b) => (a.order - b.order) || a.leaderRole.localeCompare(b.leaderRole));
    res.json(leaders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get single leader
// @route GET /api/leaders/:id
// @access Leader + SuperAdmin
const getLeaderById = async (req, res) => {
  try {
    const query = Leader.findById(req.params.id);
    if (req.role !== 'superadmin') query.select('-password');
    const leader = await query;
    if (!leader) return res.status(404).json({ message: 'Leader not found' });
    res.json(leader);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Add a new leader (or promote member)
// @route POST /api/leaders
// @access SuperAdmin only
const createLeader = async (req, res) => {
  try {
    const { name, idNumber, phoneNumber, password, leaderRole, memberId, order } = req.body;

    let leaderData = { name, idNumber, phoneNumber, password, leaderRole, order: order || 0 };

    // If promoting a member, fetch their details
    if (memberId) {
      const member = await Member.findById(memberId).select('+password');
      if (!member) return res.status(404).json({ message: 'Member not found' });
      
      leaderData = {
        name: member.name,
        idNumber: member.idNumber,
        phoneNumber: member.phoneNumber,
        password: member.password, // This will be the hashed password, but pre-save will re-hash it if not careful.
        leaderRole: leaderRole,
        profilePhoto: member.profilePhoto
      };
    }

    if (!leaderData.name || !leaderData.idNumber || !leaderData.phoneNumber || !leaderData.password || !leaderData.leaderRole)
      return res.status(400).json({ message: 'All fields are required' });

    const existing = await Leader.findOne({ idNumber: leaderData.idNumber });
    if (existing) {
      if (existing.isActive) return res.status(400).json({ message: 'Leader with this ID already exists' });
      // Reactivate if inactive
      existing.isActive = true;
      existing.leaderRole = leaderData.leaderRole;
      await existing.save();
      return res.status(200).json(existing);
    }

    let profilePhoto = leaderData.profilePhoto || { url: '', publicId: '' };
    if (req.file) {
      profilePhoto = { url: req.file.path, publicId: req.file.filename };
    }

    const leader = await Leader.create({
      ...leaderData,
      profilePhoto,
      addedBy: 'superadmin',
    });

    res.status(201).json(leader);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update leader (name, phone, role, photo) - leaders can edit this page
// @route PUT /api/leaders/:id
// @access Leader + SuperAdmin (requires approved changeRequest for leaders)
const updateLeader = async (req, res) => {
  try {
    const leader = await Leader.findById(req.params.id);
    if (!leader) return res.status(404).json({ message: 'Leader not found' });

    const { name, phoneNumber, leaderRole, password, order } = req.body;

    if (name) leader.name = name;
    if (phoneNumber) leader.phoneNumber = phoneNumber;
    if (leaderRole) leader.leaderRole = leaderRole;
    if (password) leader.password = password; // will be hashed by pre-save
    if (order !== undefined) leader.order = order;

    if (req.file) {
      // Delete old photo from cloudinary if exists
      if (leader.profilePhoto && leader.profilePhoto.publicId) {
        await cloudinary.uploader.destroy(leader.profilePhoto.publicId);
      }
      leader.profilePhoto = { url: req.file.path, publicId: req.file.filename };
    }

    const updated = await leader.save();
    res.json({ message: 'Leader updated', leader: { _id: updated._id, name: updated.name, leaderRole: updated.leaderRole, profilePhoto: updated.profilePhoto } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Delete / deactivate leader
// @route DELETE /api/leaders/:id
// @access SuperAdmin only
const deleteLeader = async (req, res) => {
  try {
    const leader = await Leader.findById(req.params.id);
    if (!leader) return res.status(404).json({ message: 'Leader not found' });
    leader.isActive = false;
    await leader.save();
    res.json({ message: 'Leader deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllLeaders, getLeaderById, createLeader, updateLeader, deleteLeader };

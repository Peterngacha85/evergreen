const Claim = require('../models/Claim');

// @desc  Create a claim record
// @route POST /api/claims
// @access Leader + SuperAdmin
const createClaim = async (req, res) => {
  try {
    const { memberId, title, description, amount, claimType, notes } = req.body;

    if (!memberId || !title || !description || !amount || !claimType)
      return res.status(400).json({ message: 'Member, title, description, amount and type are required' });

    const claim = await Claim.create({
      member: memberId,
      title,
      description,
      amount,
      claimType,
      notes,
      recordedBy: req.user._id,
      changeRequest: req.body.changeRequestId || null,
    });

    const populated = await claim.populate([
      { path: 'member', select: 'name idNumber' },
      { path: 'recordedBy', select: 'name leaderRole' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get all claims (leaders view)
// @route GET /api/claims
// @access Leader + SuperAdmin
const getAllClaims = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.memberId) filter.member = req.query.memberId;
    if (req.query.claimType) filter.claimType = req.query.claimType;

    const claims = await Claim.find(filter)
      .populate('member', 'name idNumber phoneNumber')
      .populate('recordedBy', 'name leaderRole')
      .populate('updatedBy', 'name leaderRole')
      .sort({ createdAt: -1 });

    res.json(claims);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get member's own claims
// @route GET /api/claims/my
// @access Member
const getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ member: req.user._id })
      .populate('recordedBy', 'name leaderRole')
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update claim status (approve/reject/mark paid)
// @route PATCH /api/claims/:id/status
// @access Leader + SuperAdmin
const updateClaimStatus = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    const { status, notes } = req.body;
    if (!['pending', 'approved', 'paid', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    claim.status = status;
    if (notes) claim.notes = notes;
    if (status === 'paid') claim.datePaid = new Date();
    claim.updatedBy = req.user._id;

    const updated = await claim.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Delete claim
// @route DELETE /api/claims/:id
// @access Leader + SuperAdmin
const deleteClaim = async (req, res) => {
  try {
    await Claim.findByIdAndDelete(req.params.id);
    res.json({ message: 'Claim deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createClaim, getAllClaims, getMyClaims, updateClaimStatus, deleteClaim };

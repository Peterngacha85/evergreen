const ChangeRequest = require('../models/ChangeRequest');
const Leader = require('../models/Leader');

// @desc  Create a change request (leader requests approval to make changes)
// @route POST /api/change-requests
// @access Leader only
const createChangeRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    // Check if this leader already has a pending/approved active request
    const existing = await ChangeRequest.findOne({
      requestedBy: req.user._id,
      status: { $in: ['pending', 'approved'] },
      expiresAt: { $gt: new Date() },
    });

    if (existing) {
      return res.status(400).json({
        message: 'You already have an active change request',
        changeRequest: existing,
      });
    }

    const expiresAt = new Date(Date.now() + parseInt(process.env.CHANGE_REQUEST_EXPIRY_MS || 1800000));

    const changeRequest = await ChangeRequest.create({
      requestedBy: req.user._id,
      reason,
      expiresAt,
    });

    const populated = await changeRequest.populate('requestedBy', 'name leaderRole');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Vote on a change request (approve or reject)
// @route POST /api/change-requests/:id/vote
// @access Leader only (not the requester)
const voteOnChangeRequest = async (req, res) => {
  try {
    const { approved } = req.body;
    if (typeof approved !== 'boolean')
      return res.status(400).json({ message: 'approved (boolean) is required' });

    const changeRequest = await ChangeRequest.findById(req.params.id);
    if (!changeRequest) return res.status(404).json({ message: 'Change request not found' });

    if (changeRequest.status === 'expired' || changeRequest.expiresAt < new Date()) {
      changeRequest.status = 'expired';
      await changeRequest.save();
      return res.status(400).json({ message: 'This change request has expired' });
    }

    if (changeRequest.status !== 'pending')
      return res.status(400).json({ message: `Cannot vote on a ${changeRequest.status} request` });

    // Requester cannot vote on their own request
    if (changeRequest.requestedBy.toString() === req.user._id.toString())
      return res.status(403).json({ message: 'You cannot vote on your own request' });

    // Check if this leader already voted
    const alreadyVoted = changeRequest.votes.find(
      (v) => v.leader.toString() === req.user._id.toString()
    );
    if (alreadyVoted) return res.status(400).json({ message: 'You have already voted on this request' });

    // Add vote
    changeRequest.votes.push({ leader: req.user._id, approved });

    // If rejected by any one leader → rejected
    if (!approved) {
      changeRequest.status = 'rejected';
      await changeRequest.save();
      return res.json({ message: 'Request rejected', changeRequest });
    }

    // Check if fully approved (all other active leaders voted yes)
    const totalLeaders = await Leader.countDocuments({ isActive: true });
    const approvals = changeRequest.votes.filter((v) => v.approved).length;

    // All leaders except requester must approve
    if (approvals >= totalLeaders - 1) {
      changeRequest.status = 'approved';
    }

    await changeRequest.save();
    const populated = await changeRequest.populate([
      { path: 'requestedBy', select: 'name leaderRole' },
      { path: 'votes.leader', select: 'name leaderRole' },
    ]);

    res.json({ message: `Vote recorded. Status: ${changeRequest.status}`, changeRequest: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get all change requests
// @route GET /api/change-requests
// @access Leader + SuperAdmin
const getAllChangeRequests = async (req, res) => {
  try {
    // Auto-expire stale requests
    await ChangeRequest.updateMany(
      { status: 'pending', expiresAt: { $lt: new Date() } },
      { $set: { status: 'expired' } }
    );
    await ChangeRequest.updateMany(
      { status: 'approved', expiresAt: { $lt: new Date() } },
      { $set: { status: 'expired' } }
    );

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const requests = await ChangeRequest.find(filter)
      .populate('requestedBy', 'name leaderRole profilePhoto')
      .populate('votes.leader', 'name leaderRole')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get a single change request
// @route GET /api/change-requests/:id
// @access Leader + SuperAdmin
const getChangeRequestById = async (req, res) => {
  try {
    const changeRequest = await ChangeRequest.findById(req.params.id)
      .populate('requestedBy', 'name leaderRole profilePhoto')
      .populate('votes.leader', 'name leaderRole');

    if (!changeRequest) return res.status(404).json({ message: 'Change request not found' });
    res.json(changeRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Validate that a leader has an active approved change request
// @route GET /api/change-requests/validate
// @access Leader (middleware helper)
const validateActiveSession = async (req, res) => {
  try {
    const activeRequest = await ChangeRequest.findOne({
      requestedBy: req.user._id,
      status: 'approved',
      expiresAt: { $gt: new Date() },
    }).populate('requestedBy', 'name leaderRole');

    if (!activeRequest) {
      return res.status(403).json({
        hasSession: false,
        message: 'No active approved change session. Please request approval from other leaders.',
      });
    }

    res.json({ hasSession: true, changeRequest: activeRequest });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createChangeRequest,
  voteOnChangeRequest,
  getAllChangeRequests,
  getChangeRequestById,
  validateActiveSession,
};

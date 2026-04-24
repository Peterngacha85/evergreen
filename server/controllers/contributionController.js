const Contribution = require('../models/Contribution');

// @desc  Add a contribution
// @route POST /api/contributions
// @access Leader + SuperAdmin
const addContribution = async (req, res) => {
  try {
    const { memberId, amount, category, description, datePaid } = req.body;

    if (!memberId || !amount || !category)
      return res.status(400).json({ message: 'Member, amount, and category are required' });

    const contribution = await Contribution.create({
      member: memberId,
      amount,
      category,
      description,
      datePaid: datePaid || Date.now(),
      recordedBy: req.user._id,
      changeRequest: req.body.changeRequestId || null,
    });

    const populated = await contribution.populate([
      { path: 'member', select: 'name idNumber' },
      { path: 'recordedBy', select: 'name leaderRole' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get all contributions (optionally filtered by member)
// @route GET /api/contributions?memberId=xxx&category=xxx
// @access Leader + SuperAdmin
const getAllContributions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.memberId) filter.member = req.query.memberId;
    if (req.query.category) filter.category = req.query.category;

    const contributions = await Contribution.find(filter)
      .populate('member', 'name idNumber')
      .populate('recordedBy', 'name leaderRole')
      .sort({ datePaid: -1 });

    res.json(contributions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get logged-in member's own contributions
// @route GET /api/contributions/my
// @access Member
const getMyContributions = async (req, res) => {
  try {
    const contributions = await Contribution.find({ member: req.user._id })
      .populate('recordedBy', 'name leaderRole')
      .sort({ datePaid: -1 });
    res.json(contributions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get contribution summary (total funds per category)
// @route GET /api/contributions/summary
// @access Leader + Member + SuperAdmin
const getContributionSummary = async (req, res) => {
  try {
    const summary = await Contribution.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const grandTotal = summary.reduce((acc, cur) => acc + cur.total, 0);
    res.json({ summary, grandTotal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update a contribution
// @route PUT /api/contributions/:id
// @access Leader + SuperAdmin
const updateContribution = async (req, res) => {
  try {
    const contribution = await Contribution.findById(req.params.id);
    if (!contribution) return res.status(404).json({ message: 'Contribution not found' });

    const { amount, category, description, datePaid } = req.body;
    if (amount) contribution.amount = amount;
    if (category) contribution.category = category;
    if (description) contribution.description = description;
    if (datePaid) contribution.datePaid = datePaid;

    const updated = await contribution.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Delete a contribution
// @route DELETE /api/contributions/:id
// @access Leader + SuperAdmin
const deleteContribution = async (req, res) => {
  try {
    await Contribution.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contribution deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  addContribution, getAllContributions, getMyContributions,
  getContributionSummary, updateContribution, deleteContribution,
};

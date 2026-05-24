const Contribution = require('../models/Contribution');
const ContributionCampaign = require('../models/ContributionCampaign');

// Categories that go directly to the Emergency Kit (NOT campaign-based)
const EMERGENCY_KIT_CATEGORIES = [
  'Registration Fee', 'Emergency Fee', 'Registration', 'Emergency',
  'registration fee', 'emergency fee', 'registration', 'emergency',
];

const normalizeCategory = (category) => (category || '').toString().trim();
const isEmergencyKitCategory = (category) => EMERGENCY_KIT_CATEGORIES.some(
  (ec) => ec.toLowerCase() === normalizeCategory(category).toLowerCase()
);

// @desc  Add a contribution
// @route POST /api/contributions
// @access Leader + SuperAdmin
const addContribution = async (req, res) => {
  try {
    const { memberId, amount, category, description, datePaid } = req.body;
    const normalizedCategory = normalizeCategory(category);

    if (!memberId || !amount || !normalizedCategory)
      return res.status(400).json({ message: 'Member, amount, and category are required' });

    const emergencyKit = isEmergencyKitCategory(normalizedCategory);
    let campaignId = null;
    let finalCategory = normalizedCategory;

    // For non-emergency-kit categories, require an active campaign and lock category to it
    if (!emergencyKit) {
      const activeCampaign = await ContributionCampaign.findOne({ status: 'active' });
      if (!activeCampaign) {
        return res.status(400).json({
          message: 'No active contribution campaign. A leader must start a campaign before recording event contributions.',
          requiresCampaign: true,
        });
      }
      campaignId = activeCampaign._id;
      finalCategory = normalizeCategory(activeCampaign.category);
    }

    const contribution = await Contribution.create({
      member: memberId,
      amount,
      category: finalCategory,
      description,
      datePaid: datePaid || Date.now(),
      recordedBy: req.user._id,
      changeRequest: req.body.changeRequestId || null,
      campaign: campaignId,
    });

    const populated = await contribution.populate([
      { path: 'member', select: 'name idNumber' },
      { path: 'recordedBy', select: 'name leaderRole' },
      { path: 'campaign', select: 'title category status' },
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
      .populate('campaign', 'title category status')
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
      .populate('campaign', 'title category status')
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
    const hasCategoryUpdate = category !== undefined && category !== null;
    const normalizedCategory = hasCategoryUpdate ? normalizeCategory(category) : null;
    const emergencyKit = hasCategoryUpdate ? isEmergencyKitCategory(normalizedCategory) : null;

    // If contribution belongs to an existing campaign, keep it linked and lock category to that campaign
    let currentCampaign = null;
    if (contribution.campaign) {
      currentCampaign = await ContributionCampaign.findById(contribution.campaign);
    }

    if (amount !== undefined) contribution.amount = amount;
    if (description !== undefined) contribution.description = description;
    if (datePaid !== undefined) contribution.datePaid = datePaid;

    if (hasCategoryUpdate) {
      if (emergencyKit) {
        contribution.category = normalizedCategory;
        contribution.campaign = null;
      } else {
        const activeCampaign = currentCampaign || await ContributionCampaign.findOne({ status: 'active' });
        if (!activeCampaign) {
          return res.status(400).json({
            message: 'No active contribution campaign. A leader must start a campaign before recording event contributions.',
            requiresCampaign: true,
          });
        }
        contribution.category = normalizeCategory(activeCampaign.category);
        contribution.campaign = activeCampaign._id;
      }
    } else if (currentCampaign) {
      contribution.category = normalizeCategory(currentCampaign.category);
    }

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

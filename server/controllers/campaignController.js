const ContributionCampaign = require('../models/ContributionCampaign');
const Contribution = require('../models/Contribution');

// @desc  Create a new campaign (start an event contribution drive)
// @route POST /api/campaigns
// @access Leader + SuperAdmin
const createCampaign = async (req, res) => {
  try {
    const { title, category, description, targetAmount, targetMember, claim } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: 'Title and category are required.' });
    }

    // Multiple campaigns can run at once (e.g. two different families' demise
    // drives), but avoid accidentally starting two active campaigns for the
    // same member.
    if (targetMember) {
      const duplicate = await ContributionCampaign.findOne({ status: 'active', targetMember })
        .populate('targetMember', 'name idNumber');
      if (duplicate) {
        return res.status(400).json({
          message: `${duplicate.targetMember?.name || 'This member'} already has an active campaign: "${duplicate.title}". Complete it before starting another one for the same member.`,
          activeCampaign: duplicate,
        });
      }
    }

    const campaign = await ContributionCampaign.create({
      title,
      category,
      description,
      targetAmount: targetAmount || undefined,
      targetMember: targetMember || undefined,
      claim: claim || undefined,
      recordedBy: req.user._id,
    });

    const populated = await campaign.populate([
      { path: 'recordedBy', select: 'name leaderRole' },
      { path: 'targetMember', select: 'name idNumber' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get all currently active campaigns (each with its total raised)
// @route GET /api/campaigns/active
// @access Leader + Member + SuperAdmin
const getActiveCampaigns = async (req, res) => {
  try {
    const campaigns = await ContributionCampaign.find({ status: 'active' })
      .populate('recordedBy', 'name leaderRole')
      .populate('targetMember', 'name idNumber')
      .sort({ createdAt: -1 });

    if (campaigns.length === 0) return res.json([]);

    // Aggregate total contributions linked to each campaign
    const agg = await Contribution.aggregate([
      { $match: { campaign: { $in: campaigns.map((c) => c._id) } } },
      { $group: { _id: '$campaign', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const totalsById = new Map(agg.map((a) => [String(a._id), a]));

    const result = campaigns.map((c) => {
      const totals = totalsById.get(String(c._id));
      return { ...c.toObject(), totalRaised: totals?.total || 0, contributionCount: totals?.count || 0 };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Complete a campaign (mark as paid out)
// @route POST /api/campaigns/:id/complete
// @access Leader + SuperAdmin
const completeCampaign = async (req, res) => {
  try {
    const campaign = await ContributionCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found.' });
    if (campaign.status === 'completed') return res.status(400).json({ message: 'Campaign is already completed.' });

    // Calculate final amount raised
    const agg = await Contribution.aggregate([
      { $match: { campaign: campaign._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalAmountRaised = agg[0]?.total || 0;

    campaign.status = 'completed';
    campaign.completedAt = new Date();
    campaign.completedBy = req.user._id;
    campaign.payoutNotes = req.body.payoutNotes || '';
    campaign.totalAmountRaised = totalAmountRaised;

    await campaign.save();

    // Optionally update linked claim to 'paid'
    if (campaign.claim && req.body.markClaimPaid) {
      const Claim = require('../models/Claim');
      await Claim.findByIdAndUpdate(campaign.claim, { status: 'paid' });
    }

    const populated = await campaign.populate([
      { path: 'recordedBy', select: 'name leaderRole' },
      { path: 'completedBy', select: 'name leaderRole' },
      { path: 'targetMember', select: 'name idNumber' },
    ]);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get history of all completed campaigns
// @route GET /api/campaigns/history
// @access Leader + Member + SuperAdmin
const getCampaignHistory = async (req, res) => {
  try {
    const campaigns = await ContributionCampaign.find({ status: 'completed' })
      .populate('recordedBy', 'name leaderRole')
      .populate('completedBy', 'name leaderRole')
      .populate('targetMember', 'name idNumber')
      .sort({ completedAt: -1 });

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get all campaigns (both active and completed)
// @route GET /api/campaigns
// @access Leader + SuperAdmin
const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await ContributionCampaign.find()
      .populate('recordedBy', 'name leaderRole')
      .populate('completedBy', 'name leaderRole')
      .populate('targetMember', 'name idNumber')
      .sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createCampaign,
  getActiveCampaigns,
  completeCampaign,
  getCampaignHistory,
  getAllCampaigns,
};

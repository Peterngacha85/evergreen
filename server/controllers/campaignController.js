const mongoose = require('mongoose');
const ContributionCampaign = require('../models/ContributionCampaign');
const Contribution = require('../models/Contribution');
const Member = require('../models/Member');
const Setting = require('../models/Setting');

// Older campaigns were created before per-campaign minimums existed; they
// fall back to the current global default until a leader sets their own.
const effectiveMinimum = (campaign, defaultMin) =>
  campaign.minContribution != null ? campaign.minContribution : (defaultMin || 0);

const paymentStatus = (paid, minimum) => {
  if (paid <= 0) return 'unpaid';
  if (minimum > 0 && paid < minimum) return 'partial';
  return 'paid';
};

// Who is expected to pay: active members who had joined by the time the
// campaign started, excluding the member the campaign is supporting.
const isEligible = (member, campaign) => {
  if (!member.isActive) return false;
  if (campaign.targetMember && String(campaign.targetMember._id || campaign.targetMember) === String(member._id)) return false;
  const joined = new Date(member.joinDate || member.createdAt);
  return joined <= new Date(campaign.createdAt);
};

// Builds one row per member who either owes or has paid toward the campaign.
// `contribs` are this campaign's contributions (at most one per member).
const buildCampaignRows = (campaign, members, contribs, minimum) => {
  const contribByMember = new Map(contribs.map((c) => [String(c.member), c]));
  const rows = [];

  for (const member of members) {
    const contrib = contribByMember.get(String(member._id));
    const eligible = isEligible(member, campaign);
    if (!eligible && !contrib) continue;

    const paid = contrib?.amount || 0;
    rows.push({
      member: {
        _id: member._id, name: member.name, idNumber: member.idNumber,
        phoneNumber: member.phoneNumber, profilePhoto: member.profilePhoto,
      },
      eligible,
      status: paymentStatus(paid, minimum),
      paid,
      outstanding: eligible ? Math.max(0, minimum - paid) : 0,
      contributionId: contrib?._id || null,
      datePaid: contrib?.datePaid || null,
      description: contrib?.description || '',
    });
  }

  rows.sort((a, b) => a.member.idNumber.localeCompare(b.member.idNumber));
  return rows;
};

const summarizeRows = (rows, minimum) => {
  const eligibleRows = rows.filter((r) => r.eligible);
  return {
    eligibleCount: eligibleRows.length,
    paidCount: rows.filter((r) => r.status === 'paid').length,
    partialCount: rows.filter((r) => r.status === 'partial').length,
    unpaidCount: rows.filter((r) => r.status === 'unpaid').length,
    totalCollected: rows.reduce((sum, r) => sum + r.paid, 0),
    expectedTotal: eligibleRows.length * minimum,
    outstandingTotal: rows.reduce((sum, r) => sum + r.outstanding, 0),
  };
};

// @desc  Create a new campaign (start an event contribution drive)
// @route POST /api/campaigns
// @access Leader + SuperAdmin
const createCampaign = async (req, res) => {
  try {
    const { title, category, description, targetAmount, targetMember, claim } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: 'Title and category are required.' });
    }

    let minContribution;
    if (req.body.minContribution !== undefined && req.body.minContribution !== '' && req.body.minContribution !== null) {
      minContribution = Number(req.body.minContribution);
      if (!Number.isFinite(minContribution) || minContribution < 0) {
        return res.status(400).json({ message: 'Minimum contribution must be a number of 0 or more.' });
      }
    } else {
      minContribution = await Setting.getValue('minContribution');
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
      minContribution,
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

    const [contribs, members, defaultMin] = await Promise.all([
      Contribution.find({ campaign: { $in: campaigns.map((c) => c._id) } })
        .select('member campaign amount datePaid description').lean(),
      Member.find().select('name idNumber isActive joinDate createdAt').lean(),
      Setting.getValue('minContribution'),
    ]);

    const contribsByCampaign = new Map();
    contribs.forEach((c) => {
      const key = String(c.campaign);
      if (!contribsByCampaign.has(key)) contribsByCampaign.set(key, []);
      contribsByCampaign.get(key).push(c);
    });

    // Each campaign carries its paid/partial/unpaid counts so cards and the
    // Unpaid page can show who still owes without a request per campaign.
    const result = campaigns.map((c) => {
      const own = contribsByCampaign.get(String(c._id)) || [];
      const minimum = effectiveMinimum(c, defaultMin);
      const summary = summarizeRows(buildCampaignRows(c, members, own, minimum), minimum);
      return {
        ...c.toObject(),
        effectiveMinContribution: minimum,
        totalRaised: summary.totalCollected,
        contributionCount: own.length,
        ...summary,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Paid / partial / unpaid breakdown of every member for one campaign
// @route GET /api/campaigns/:id/status
// @access Leader + Member + SuperAdmin
const getCampaignStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Campaign not found.' });
    }

    const campaign = await ContributionCampaign.findById(req.params.id)
      .populate('recordedBy', 'name leaderRole')
      .populate('completedBy', 'name leaderRole')
      .populate('targetMember', 'name idNumber');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found.' });

    const [contribs, members, defaultMin] = await Promise.all([
      Contribution.find({ campaign: campaign._id }).select('member amount datePaid description').lean(),
      Member.find().select('name idNumber phoneNumber profilePhoto isActive joinDate createdAt').lean(),
      Setting.getValue('minContribution'),
    ]);

    const minimum = effectiveMinimum(campaign, defaultMin);
    const rows = buildCampaignRows(campaign, members, contribs, minimum);

    res.json({
      campaign,
      minContribution: minimum,
      usesDefaultMinimum: campaign.minContribution == null,
      summary: summarizeRows(rows, minimum),
      rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Change the minimum contribution for one campaign only. Members who
//        had met the old minimum become "partial" if it is raised.
// @route PATCH /api/campaigns/:id/minimum
// @access Leader (approved session) + SuperAdmin
const updateCampaignMinimum = async (req, res) => {
  try {
    const value = Number(req.body.minContribution);
    if (req.body.minContribution === '' || !Number.isFinite(value) || value < 0) {
      return res.status(400).json({ message: 'Minimum contribution must be a number of 0 or more.' });
    }

    const campaign = await ContributionCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found.' });
    if (campaign.status === 'completed') {
      return res.status(400).json({ message: 'This campaign is closed; its minimum can no longer be changed.' });
    }

    campaign.minContribution = value;
    await campaign.save();
    res.json(campaign);
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
  getCampaignStatus,
  updateCampaignMinimum,
};

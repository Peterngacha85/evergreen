const Contribution = require('../models/Contribution');
const Claim = require('../models/Claim');
const Member = require('../models/Member');
const Expense = require('../models/Expense');
const ContributionCampaign = require('../models/ContributionCampaign');

// @desc    Get financial overview
// @route   GET /api/stats/funds
// @access  Private/Leader
exports.getFundsOverview = async (req, res) => {
  try {
    const [totalExpenses, emergencyContributions, activeCampaigns] = await Promise.all([
      Expense.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Contribution.aggregate([
        {
          $match: {
            $or: [
              { category: { $in: ['Registration Fee', 'Emergency Fee', 'Registration', 'Emergency'] } },
              // Also catch any lowercase variants
              { category: /^(registration fee|emergency fee|registration|emergency)$/i }
            ]
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      ContributionCampaign.find({ status: 'active' })
        .populate('targetMember', 'name idNumber')
        .sort({ createdAt: -1 })
    ]);

    // Emergency Kit: fees collected minus all expenses
    const emergencyIn = emergencyContributions[0]?.total || 0;
    const totalOutExpenses = totalExpenses[0]?.total || 0;
    const emergencyBalance = emergencyIn - totalOutExpenses;

    // Contributions per active campaign (several may be running at once)
    let campaignStatsList = [];
    if (activeCampaigns.length > 0) {
      const campaignAgg = await Contribution.aggregate([
        { $match: { campaign: { $in: activeCampaigns.map((c) => c._id) } } },
        { $group: { _id: '$campaign', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]);
      const totalsById = new Map(campaignAgg.map((a) => [String(a._id), a]));
      campaignStatsList = activeCampaigns.map((campaign) => {
        const totals = totalsById.get(String(campaign._id));
        return {
          campaign,
          totalRaised: totals?.total || 0,
          contributionCount: totals?.count || 0,
        };
      });
    }

    // Also get counts
    const [memberCount, pendingClaims] = await Promise.all([
      Member.countDocuments({ isActive: true }),
      Claim.countDocuments({ status: 'pending' })
    ]);

    res.json({
      // Emergency Kit Fund (the reserve)
      emergencyIn,
      totalOutExpenses,
      emergencyBalance,

      // Alias for legacy frontend compatibility
      balance: emergencyBalance,

      // Snapshot of every active campaign (empty array if none)
      campaignStatsList,
      // Legacy alias: first active campaign, for older frontend code still reading the singular field
      campaignStats: campaignStatsList[0] || null,

      // Global stats
      memberCount,
      pendingClaims
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get unpaid members (members who haven't contributed in 31 days)
// @route   GET /api/stats/unpaid
// @access  Private/Leader
exports.getUnpaidMembers = async (req, res) => {
  try {
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

    // 1. Get all active members
    const members = await Member.find({ isActive: true }).select('name idNumber phoneNumber createdAt');

    // 2. Get last contribution date for each member
    const unpaidMembers = [];

    for (const member of members) {
      const lastContrib = await Contribution.findOne({ member: member._id })
        .sort({ datePaid: -1 });

      if (!lastContrib) {
        // Never contributed - check if they joined more than 31 days ago
        if (new Date(member.createdAt) < thirtyOneDaysAgo) {
          unpaidMembers.push({ member, lastDate: null, daysSince: 'Never' });
        }
      } else if (new Date(lastContrib.datePaid) < thirtyOneDaysAgo) {
        const daysSince = Math.floor((new Date() - new Date(lastContrib.datePaid)) / (1000 * 60 * 60 * 24));
        unpaidMembers.push({ 
          member, 
          lastDate: lastContrib.datePaid, 
          amount: lastContrib.amount,
          daysSince 
        });
      }
    }

    unpaidMembers.sort((a, b) => a.member.idNumber.localeCompare(b.member.idNumber));

    res.json(unpaidMembers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

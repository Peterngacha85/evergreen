const Contribution = require('../models/Contribution');
const Claim = require('../models/Claim');
const Member = require('../models/Member');

// @desc    Get financial overview
// @route   GET /api/stats/funds
// @access  Private/Leader
exports.getFundsOverview = async (req, res) => {
  try {
    const [totalContributions, totalClaimsPaid] = await Promise.all([
      Contribution.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Claim.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    const totalIn = totalContributions[0]?.total || 0;
    const totalOut = totalClaimsPaid[0]?.total || 0;
    const balance = totalIn - totalOut;

    // Also get counts
    const [memberCount, pendingClaims] = await Promise.all([
      Member.countDocuments({ isActive: true }),
      Claim.countDocuments({ status: 'pending' })
    ]);

    res.json({
      totalIn,
      totalOut,
      balance,
      memberCount,
      pendingClaims
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get defaulters (members who haven't contributed in 30 days)
// @route   GET /api/stats/defaulters
// @access  Private/Leader
exports.getDefaulters = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Get all active members
    const members = await Member.find({ isActive: true }).select('name idNumber phoneNumber createdAt');

    // 2. Get last contribution date for each member
    const defaulters = [];

    for (const member of members) {
      const lastContrib = await Contribution.findOne({ member: member._id })
        .sort({ datePaid: -1 });

      if (!lastContrib) {
        // Never contributed - check if they joined more than 30 days ago
        if (new Date(member.createdAt) < thirtyDaysAgo) {
          defaulters.push({ member, lastDate: null, daysSince: 'Never' });
        }
      } else if (new Date(lastContrib.datePaid) < thirtyDaysAgo) {
        const daysSince = Math.floor((new Date() - new Date(lastContrib.datePaid)) / (1000 * 60 * 60 * 24));
        defaulters.push({ 
          member, 
          lastDate: lastContrib.datePaid, 
          amount: lastContrib.amount,
          daysSince 
        });
      }
    }

    res.json(defaulters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

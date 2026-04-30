const Contribution = require('../models/Contribution');
const Claim = require('../models/Claim');
const Member = require('../models/Member');
const Expense = require('../models/Expense');

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
      ]),
      Expense.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    const totalIn = totalContributions[0]?.total || 0;
    const totalOutClaims = totalClaimsPaid[0]?.total || 0;
    const totalOutExpenses = totalExpenses[0]?.total || 0;
    const balance = totalIn - totalOutClaims - totalOutExpenses;

    // Also get counts
    const [memberCount, pendingClaims] = await Promise.all([
      Member.countDocuments({ isActive: true }),
      Claim.countDocuments({ status: 'pending' })
    ]);

    res.json({
      totalIn,
      totalOutClaims,
      totalOutExpenses,
      totalOut: totalOutClaims + totalOutExpenses,
      balance,
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

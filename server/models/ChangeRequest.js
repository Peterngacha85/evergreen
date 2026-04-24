const mongoose = require('mongoose');

// Each leader's vote on a change request
const voteSchema = new mongoose.Schema({
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'Leader', required: true },
  approved: { type: Boolean, required: true },
  votedAt: { type: Date, default: Date.now },
});

const changeRequestSchema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Leader', required: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired'],
      default: 'pending',
    },
    votes: [voteSchema],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + parseInt(process.env.CHANGE_REQUEST_EXPIRY_MS || 1800000)),
    },
    sessionUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Virtual: check if all leaders have approved
changeRequestSchema.methods.isFullyApproved = async function () {
  const Leader = mongoose.model('Leader');
  const totalLeaders = await Leader.countDocuments({ isActive: true });
  const approvals = this.votes.filter((v) => v.approved).length;
  // The requester is excluded from voting (they initiated)
  return approvals >= totalLeaders - 1;
};

module.exports = mongoose.model('ChangeRequest', changeRequestSchema);

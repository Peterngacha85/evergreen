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
      default: () => new Date(Date.now() + parseInt(process.env.CHANGE_REQUEST_EXPIRY_MS || 86400000)),
    },
    sessionUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const APPROVER_ROLES = ['Chairperson', 'Secretary', 'Treasurer'];

// Check if all required approvers (Chairperson, Secretary, Treasurer) have approved
changeRequestSchema.methods.isFullyApproved = async function () {
  const Leader = mongoose.model('Leader');
  const approvers = await Leader.find({ isActive: true, leaderRole: { $in: APPROVER_ROLES } }, '_id');
  const approverIds = approvers.map((l) => l._id.toString());
  const requiredIds = approverIds.filter((id) => id !== this.requestedBy.toString());
  const approvalCount = this.votes.filter(
    (v) => v.approved && approverIds.includes(v.leader.toString())
  ).length;
  return approvalCount >= requiredIds.length;
};

module.exports = mongoose.model('ChangeRequest', changeRequestSchema);

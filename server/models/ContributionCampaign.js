const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    targetAmount: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active'
    },
    targetMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
    },
    claim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim'
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Leader',
      required: true
    },
    completedAt: {
      type: Date
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Leader'
    },
    payoutNotes: {
      type: String,
      trim: true
    },
    totalAmountRaised: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContributionCampaign', campaignSchema);

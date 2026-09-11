const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      trim: true,
      // Occasional / need-based categories e.g. "Medical", "Bereavement", "Development Fund"
    },
    description: { type: String, trim: true },
    datePaid: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Leader', required: true },
    changeRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ChangeRequest' },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'ContributionCampaign' },
  },
  { timestamps: true }
);

// Backstop against race-condition double entry — the app-level check in
// contributionController handles the friendly, user-facing message.
contributionSchema.index(
  { member: 1, category: 1, amount: 1, datePaid: 1, campaign: 1 },
  { unique: true }
);

// A campaign is a one-time collection for a single event — a member may
// only be recorded once against a given campaign, regardless of amount/date.
contributionSchema.index(
  { member: 1, campaign: 1 },
  { unique: true, partialFilterExpression: { campaign: { $type: 'objectId' } } }
);

module.exports = mongoose.model('Contribution', contributionSchema);

const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    claimType: {
      type: String,
      enum: ['Medical', 'Bereavement', 'Emergency', 'Education', 'Other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'rejected'],
      default: 'pending',
    },
    dateClaimed: { type: Date, default: Date.now },
    datePaid: { type: Date },
    notes: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Leader', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Leader' },
    changeRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ChangeRequest' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Claim', claimSchema);

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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contribution', contributionSchema);

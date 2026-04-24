const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    type: { type: String, enum: ['contribution', 'claim', 'event', 'both'], default: 'contribution' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Leader' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);

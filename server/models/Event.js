const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date, required: true },
    location: { type: String, trim: true },
    category: {
      type: String,
      enum: ['Meeting', 'Fundraiser', 'Social', 'Emergency', 'Other'],
      default: 'Meeting',
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Leader', required: true },
    changeRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ChangeRequest' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);

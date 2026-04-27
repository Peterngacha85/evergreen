const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      default: 'General'
    },
    addedBy: {
      type: String, // 'superadmin' or leader name
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);

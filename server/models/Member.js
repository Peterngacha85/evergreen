const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    idNumber: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true,
      match: [/^\d{3}$/, 'Member number must be exactly 3 digits (e.g., 001)']
    },
    phoneNumber: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 4 },
    plainPassword: { type: String, default: '' },
    profilePhoto: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    role: { type: String, default: 'member' },
    isActive: { type: Boolean, default: true },
    // Deactivated for non-payment, either automatically when a campaign
    // deadline passes or by a leader. The member cannot log in until a leader
    // reactivates them. Unlike isActive (removed from the group), they stay
    // on the members list.
    isDeactivated: { type: Boolean, default: false },
    deactivationHistory: [{
      deactivatedAt: { type: Date, required: true },
      // Set when a leader deactivated the member by hand
      deactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Leader' },
      reason: { type: String, trim: true },
      campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'ContributionCampaign' },
      amountOwed: { type: Number },
      reactivatedAt: { type: Date },
      reactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Leader' },
    }],
    joinDate: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Leader' },
  },
  { timestamps: true }
);

memberSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  // If password already looks like a bcrypt hash, don't hash it again
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

memberSchema.methods.matchPassword = async function (enteredPassword) {
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
  return enteredPassword === this.password;
};

module.exports = mongoose.model('Member', memberSchema);

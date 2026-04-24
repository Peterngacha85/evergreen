const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const LEADER_ROLES = ['Chairman', 'Vice Chairman', 'Secretary', 'Treasurer', 'Organizer'];

const leaderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    idNumber: { type: String, required: true, unique: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    leaderRole: { type: String, enum: LEADER_ROLES, required: true },
    profilePhoto: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    role: { type: String, default: 'leader' },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String, default: 'superadmin' },
  },
  { timestamps: true }
);

leaderSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

leaderSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Leader', leaderSchema);

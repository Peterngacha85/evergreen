const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const LEADER_ROLES = ['Chairman', 'Vice Chairman', 'Secretary', 'Treasurer', 'Organizer'];

const leaderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    idNumber: { type: String, required: true, unique: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    password: { type: String, required: true },
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

leaderSchema.methods.matchPassword = async function (enteredPassword) {
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
  return enteredPassword === this.password;
};

module.exports = mongoose.model('Leader', leaderSchema);

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
    password: { type: String, required: true },
    plainPassword: { type: String, default: '' },
    profilePhoto: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    role: { type: String, default: 'member' },
    isActive: { type: Boolean, default: true },
    joinDate: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Leader' },
  },
  { timestamps: true }
);

memberSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
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

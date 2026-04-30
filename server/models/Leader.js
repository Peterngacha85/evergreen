const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const leaderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    idNumber: { type: String, required: true, unique: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 4 },
    plainPassword: { type: String, default: '' },
    leaderRole: { type: String, required: true },
    profilePhoto: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    role: { type: String, default: 'leader' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String, default: 'superadmin' },
  },
  { timestamps: true }
);

leaderSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  
  // If password already looks like a bcrypt hash, don't hash it again
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

leaderSchema.methods.matchPassword = async function (enteredPassword) {
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
  return enteredPassword === this.password;
};

module.exports = mongoose.model('Leader', leaderSchema);

const mongoose = require('mongoose');

// Key/value store for organisation-wide settings editable by the super admin
// (e.g. the default minimum contribution per member for new campaigns).
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Leader' },
  },
  { timestamps: true }
);

const DEFAULTS = {
  minContribution: 0,
};

settingSchema.statics.getValue = async function (key) {
  const doc = await this.findOne({ key }).lean();
  return doc ? doc.value : DEFAULTS[key];
};

settingSchema.statics.getAll = async function () {
  const docs = await this.find().lean();
  const result = { ...DEFAULTS };
  docs.forEach((d) => { result[d.key] = d.value; });
  return result;
};

module.exports = mongoose.model('Setting', settingSchema);

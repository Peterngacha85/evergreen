const mongoose = require('mongoose');

const missionVisionSchema = new mongoose.Schema({
  mission: {
    type: String,
    required: true,
    trim: true
  },
  vision: {
    type: String,
    required: true,
    trim: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Leader'
  }
}, { timestamps: true });

module.exports = mongoose.model('MissionVision', missionVisionSchema);

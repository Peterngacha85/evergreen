const MissionVision = require('../models/MissionVision');

// @desc    Get mission and vision
// @route   GET /api/mission-vision
// @access  Public
exports.getMissionVision = async (req, res) => {
  try {
    const data = await MissionVision.findOne().sort({ createdAt: -1 });
    res.json(data || { mission: '', vision: '' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update mission and vision
// @route   POST /api/mission-vision
// @access  Private/Leader
exports.updateMissionVision = async (req, res) => {
  try {
    const { mission, vision } = req.body;
    
    let data = await MissionVision.findOne();
    
    if (data) {
      data.mission = mission;
      data.vision = vision;
      data.lastUpdatedBy = req.user._id;
      await data.save();
    } else {
      data = await MissionVision.create({
        mission,
        vision,
        lastUpdatedBy: req.user._id
      });
    }
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

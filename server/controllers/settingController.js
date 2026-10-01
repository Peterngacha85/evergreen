const Setting = require('../models/Setting');

// @desc  Get all organisation settings
// @route GET /api/settings
// @access Any authenticated user
const getSettings = async (req, res) => {
  try {
    res.json(await Setting.getAll());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update the default minimum contribution per member. Only affects
//        campaigns started afterwards — each campaign keeps its own minimum.
// @route PUT /api/settings/min-contribution
// @access SuperAdmin
const updateMinContribution = async (req, res) => {
  try {
    const value = Number(req.body.value);
    if (!Number.isFinite(value) || value < 0) {
      return res.status(400).json({ message: 'Minimum contribution must be a number of 0 or more.' });
    }

    await Setting.findOneAndUpdate(
      { key: 'minContribution' },
      { value, updatedBy: req.user._id },
      { upsert: true }
    );

    res.json(await Setting.getAll());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSettings, updateMinContribution };

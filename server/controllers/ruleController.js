const Rule = require('../models/Rule');

// @desc    Get all rules
// @route   GET /api/rules
// @access  Private
exports.getRules = async (req, res) => {
  try {
    const rules = await Rule.find().sort({ order: 1, createdAt: -1 }).populate('lastUpdatedBy', 'name');
    res.json(rules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a rule
// @route   POST /api/rules
// @access  Private/Leader
exports.createRule = async (req, res) => {
  try {
    const { title, content, order, category } = req.body;
    const rule = await Rule.create({
      title,
      content,
      order,
      category,
      lastUpdatedBy: req.user._id
    });
    res.status(201).json(rule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Update a rule
// @route   PUT /api/rules/:id
// @access  Private/Leader
exports.updateRule = async (req, res) => {
  try {
    const rule = await Rule.findById(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });

    const { title, content, order, category } = req.body;
    rule.title = title || rule.title;
    rule.content = content || rule.content;
    rule.order = order !== undefined ? order : rule.order;
    rule.category = category || rule.category;
    rule.lastUpdatedBy = req.user._id;

    await rule.save();
    res.json(rule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete a rule
// @route   DELETE /api/rules/:id
// @access  Private/Leader
exports.deleteRule = async (req, res) => {
  try {
    const rule = await Rule.findById(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });

    await rule.deleteOne();
    res.json({ message: 'Rule removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

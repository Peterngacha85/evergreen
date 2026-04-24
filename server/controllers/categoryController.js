const Category = require('../models/Category');

// @desc  Get all active categories
// @route GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Create a new category
// @route POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const category = await Category.create({ 
      name, 
      type: type || 'contribution', 
      addedBy: req.user?._id 
    });
    
    // Notify all clients about the new category
    const io = req.app.get('socketio');
    if (io) {
      io.emit('categoryAdded', category);
    }
    
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCategories, createCategory };

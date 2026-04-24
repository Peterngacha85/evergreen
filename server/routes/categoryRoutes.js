const express = require('express');
const router = express.Router();
const { getCategories, createCategory } = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { leaderOrSuperAdmin } = require('../middleware/roleMiddleware');

router.get('/', protect, getCategories);
router.post('/', protect, leaderOrSuperAdmin, createCategory);

module.exports = router;

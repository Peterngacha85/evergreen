const express = require('express');
const router = express.Router();
const { getFundsOverview, getDefaulters } = require('../controllers/statsController');
const { protect, leaderOnly } = require('../middleware/authMiddleware');

router.get('/funds', protect, leaderOnly, getFundsOverview);
router.get('/defaulters', protect, leaderOnly, getDefaulters);

module.exports = router;

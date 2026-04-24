const express = require('express');
const router = express.Router();
const { getFundsOverview, getDefaulters } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');
const { leaderOrSuperAdmin } = require('../middleware/roleMiddleware');

router.get('/funds', protect, getFundsOverview);
router.get('/defaulters', protect, leaderOrSuperAdmin, getDefaulters);

module.exports = router;

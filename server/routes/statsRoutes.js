const express = require('express');
const router = express.Router();
const { getFundsOverview, getUnpaidMembers } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');
const { leaderOrSuperAdmin } = require('../middleware/roleMiddleware');

router.get('/funds', protect, getFundsOverview);
router.get('/unpaid', protect, getUnpaidMembers);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getFundsOverview, getUnpaidMembers, getDeactivatedMembers } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');
const { leaderOrSuperAdmin } = require('../middleware/roleMiddleware');

router.get('/funds', protect, getFundsOverview);
router.get('/unpaid', protect, getUnpaidMembers);
router.get('/deactivated', protect, getDeactivatedMembers);

module.exports = router;

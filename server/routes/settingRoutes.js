const express = require('express');
const router = express.Router();
const { getSettings, updateMinContribution } = require('../controllers/settingController');
const { protect } = require('../middleware/authMiddleware');
const { superAdminOnly } = require('../middleware/roleMiddleware');

router.get('/', protect, getSettings);
router.put('/min-contribution', protect, superAdminOnly, updateMinContribution);

module.exports = router;

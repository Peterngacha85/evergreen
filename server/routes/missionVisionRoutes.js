const express = require('express');
const router = express.Router();
const { getMissionVision, updateMissionVision } = require('../controllers/missionVisionController');
const { protect } = require('../middleware/authMiddleware');
const { leaderOrSuperAdmin } = require('../middleware/roleMiddleware');

router.get('/', getMissionVision);
router.post('/', protect, leaderOrSuperAdmin, updateMissionVision);

module.exports = router;

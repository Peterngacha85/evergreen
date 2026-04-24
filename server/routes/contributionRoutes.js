const express = require('express');
const router = express.Router();
const {
  addContribution, getAllContributions, getMyContributions,
  getContributionSummary, updateContribution, deleteContribution,
} = require('../controllers/contributionController');
const { protect } = require('../middleware/authMiddleware');
const { leaderOrSuperAdmin } = require('../middleware/roleMiddleware');
const { requireApprovedSession } = require('../middleware/sessionMiddleware');

// Member — view own contributions
router.get('/my', protect, getMyContributions);

// Summary — accessible to all authenticated users
router.get('/summary', protect, getContributionSummary);

// Leaders/SuperAdmin — view all
router.get('/', protect, leaderOrSuperAdmin, getAllContributions);

// Write operations — leaders need approved session
router.post('/', protect, leaderOrSuperAdmin, requireApprovedSession, addContribution);
router.put('/:id', protect, leaderOrSuperAdmin, requireApprovedSession, updateContribution);
router.delete('/:id', protect, leaderOrSuperAdmin, requireApprovedSession, deleteContribution);

module.exports = router;

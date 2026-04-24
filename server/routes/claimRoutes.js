const express = require('express');
const router = express.Router();
const { createClaim, getAllClaims, getMyClaims, updateClaimStatus, deleteClaim } = require('../controllers/claimController');
const { protect } = require('../middleware/authMiddleware');
const { leaderOrSuperAdmin } = require('../middleware/roleMiddleware');
const { requireApprovedSession } = require('../middleware/sessionMiddleware');

// Member — view own claims
router.get('/my', protect, getMyClaims);

// Leaders/SuperAdmin — view all
router.get('/', protect, leaderOrSuperAdmin, getAllClaims);

// Write — leaders need approved session
router.post('/', protect, leaderOrSuperAdmin, requireApprovedSession, createClaim);
router.patch('/:id/status', protect, leaderOrSuperAdmin, requireApprovedSession, updateClaimStatus);
router.delete('/:id', protect, leaderOrSuperAdmin, requireApprovedSession, deleteClaim);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  createChangeRequest,
  voteOnChangeRequest,
  getAllChangeRequests,
  getChangeRequestById,
  validateActiveSession,
} = require('../controllers/changeRequestController');
const { protect } = require('../middleware/authMiddleware');
const { leaderOrSuperAdmin } = require('../middleware/roleMiddleware');

// Check if current leader has an active approved session
router.get('/validate', protect, leaderOrSuperAdmin, validateActiveSession);

// Get all change requests
router.get('/', protect, leaderOrSuperAdmin, getAllChangeRequests);

// Get single change request
router.get('/:id', protect, leaderOrSuperAdmin, getChangeRequestById);

// Create a change request (any leader)
router.post('/', protect, leaderOrSuperAdmin, createChangeRequest);

// Vote on a change request (any leader except requester)
router.post('/:id/vote', protect, leaderOrSuperAdmin, voteOnChangeRequest);

module.exports = router;

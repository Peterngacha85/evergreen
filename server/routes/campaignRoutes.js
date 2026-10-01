const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { leaderOrSuperAdmin } = require('../middleware/roleMiddleware');
const { requireApprovedSession } = require('../middleware/sessionMiddleware');
const {
  createCampaign,
  getActiveCampaigns,
  completeCampaign,
  getCampaignHistory,
  getAllCampaigns,
  getCampaignStatus,
  updateCampaignMinimum,
  updateCampaignDeadline,
} = require('../controllers/campaignController');

// All routes require authentication
router.use(protect);

// Get all active campaigns (accessible to all logged-in users)
router.get('/active', getActiveCampaigns);

// Get campaign history (accessible to all logged-in users)
router.get('/history', getCampaignHistory);

// Get all campaigns (leader/admin)
router.get('/', getAllCampaigns);

// Create a new campaign (leader/admin)
router.post('/', createCampaign);

// Paid / partial / unpaid breakdown for one campaign (accessible to all logged-in users)
router.get('/:id/status', getCampaignStatus);

// Change this campaign's minimum contribution (leader with approved session / admin)
router.patch('/:id/minimum', leaderOrSuperAdmin, requireApprovedSession, updateCampaignMinimum);

// Set/change/remove this campaign's deadline (leader with approved session / admin)
router.patch('/:id/deadline', leaderOrSuperAdmin, requireApprovedSession, updateCampaignDeadline);

// Complete a campaign (leader/admin)
router.post('/:id/complete', completeCampaign);

module.exports = router;

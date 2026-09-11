const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createCampaign,
  getActiveCampaigns,
  completeCampaign,
  getCampaignHistory,
  getAllCampaigns,
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

// Complete a campaign (leader/admin)
router.post('/:id/complete', completeCampaign);

module.exports = router;

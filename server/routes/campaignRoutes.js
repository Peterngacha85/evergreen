const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createCampaign,
  getActiveCampaign,
  completeCampaign,
  getCampaignHistory,
  getAllCampaigns,
} = require('../controllers/campaignController');

// All routes require authentication
router.use(protect);

// Get active campaign (accessible to all logged-in users)
router.get('/active', getActiveCampaign);

// Get campaign history (accessible to all logged-in users)
router.get('/history', getCampaignHistory);

// Get all campaigns (leader/admin)
router.get('/', getAllCampaigns);

// Create a new campaign (leader/admin)
router.post('/', createCampaign);

// Complete a campaign (leader/admin)
router.post('/:id/complete', completeCampaign);

module.exports = router;

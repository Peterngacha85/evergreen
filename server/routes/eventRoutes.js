const express = require('express');
const router = express.Router();
const { createEvent, getEvents, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { leaderOrSuperAdmin } = require('../middleware/roleMiddleware');
const { requireApprovedSession } = require('../middleware/sessionMiddleware');

// All authenticated users can view events
router.get('/', protect, getEvents);

// Write — leaders need approved session
router.post('/', protect, leaderOrSuperAdmin, requireApprovedSession, createEvent);
router.put('/:id', protect, leaderOrSuperAdmin, requireApprovedSession, updateEvent);
router.delete('/:id', protect, leaderOrSuperAdmin, requireApprovedSession, deleteEvent);

module.exports = router;

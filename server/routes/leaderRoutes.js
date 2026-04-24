const express = require('express');
const router = express.Router();
const {
  getAllLeaders, getLeaderById, createLeader, updateLeader, deleteLeader,
} = require('../controllers/leaderController');
const { protect } = require('../middleware/authMiddleware');
const { superAdminOnly, leaderOrSuperAdmin } = require('../middleware/roleMiddleware');
const { requireApprovedSession } = require('../middleware/sessionMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Anyone authenticated can see leaders (for the Officials page)
router.get('/', protect, getAllLeaders);
router.get('/:id', protect, leaderOrSuperAdmin, getLeaderById);

// SuperAdmin: create and delete leaders
router.post('/', protect, superAdminOnly, upload.single('profilePhoto'), createLeader);
router.delete('/:id', protect, superAdminOnly, deleteLeader);

// Leaders can update leader info (profile page editing) — requires approved session
router.put('/:id', protect, leaderOrSuperAdmin, requireApprovedSession, upload.single('profilePhoto'), updateLeader);

module.exports = router;

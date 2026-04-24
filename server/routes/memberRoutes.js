const express = require('express');
const router = express.Router();
const {
  getAllMembers, getMemberById, createMember,
  updateMemberPhoto, updateMember, deleteMember, getMyProfile,
} = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');
const { leaderOrSuperAdmin } = require('../middleware/roleMiddleware');
const { requireApprovedSession } = require('../middleware/sessionMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Member self-access
router.get('/me', protect, getMyProfile);
router.patch('/:id/photo', protect, upload.single('profilePhoto'), updateMemberPhoto);

// Leader/SuperAdmin routes
router.get('/', protect, leaderOrSuperAdmin, getAllMembers);
router.get('/:id', protect, getMemberById);

// Write operations — leaders need approved session
router.post('/', protect, leaderOrSuperAdmin, requireApprovedSession, upload.single('profilePhoto'), createMember);
router.put('/:id', protect, leaderOrSuperAdmin, requireApprovedSession, updateMember);
router.delete('/:id', protect, leaderOrSuperAdmin, requireApprovedSession, deleteMember);

module.exports = router;

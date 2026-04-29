const express = require('express');
const router = express.Router();
const { memberLogin, updateMemberPassword } = require('../controllers/authController');
const { leaderLogin, superAdminLogin, updateLeaderProfile, updateLeaderPassword } = require('../controllers/leaderAuthController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Member login — ID number + password
router.post('/member/login', memberLogin);
router.put('/member/password', protect, updateMemberPassword);

// Leader login — ID number + phone + password
router.post('/leader/login', leaderLogin);
router.put('/leader/password', protect, updateLeaderPassword);

// Super Admin login — email + password
router.post('/superadmin/login', superAdminLogin);

// Profile Update
router.put('/leader/profile', protect, upload.single('profilePhoto'), updateLeaderProfile);

module.exports = router;

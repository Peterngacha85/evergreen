const express = require('express');
const router = express.Router();
const { memberLogin } = require('../controllers/authController');
const { leaderLogin, superAdminLogin } = require('../controllers/leaderAuthController');

// Member login — ID number + password
router.post('/member/login', memberLogin);

// Leader login — ID number + phone + password
router.post('/leader/login', leaderLogin);

// Super Admin login — email + password
router.post('/superadmin/login', superAdminLogin);

module.exports = router;

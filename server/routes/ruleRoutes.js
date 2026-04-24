const express = require('express');
const router = express.Router();
const { getRules, createRule, updateRule, deleteRule } = require('../controllers/ruleController');
const { protect } = require('../middleware/authMiddleware');
const { leaderOrSuperAdmin } = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, getRules)
  .post(protect, leaderOrSuperAdmin, createRule);

router.route('/:id')
  .put(protect, leaderOrSuperAdmin, updateRule)
  .delete(protect, leaderOrSuperAdmin, deleteRule);

module.exports = router;

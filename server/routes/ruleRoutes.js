const express = require('express');
const router = express.Router();
const { getRules, createRule, updateRule, deleteRule } = require('../controllers/ruleController');
const { protect, leaderOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getRules)
  .post(protect, leaderOnly, createRule);

router.route('/:id')
  .put(protect, leaderOnly, updateRule)
  .delete(protect, leaderOnly, deleteRule);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getAllExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const { leaderOrSuperAdmin } = require('../middleware/roleMiddleware');
const { requireApprovedSession } = require('../middleware/sessionMiddleware');

router.get('/', protect, getAllExpenses);
router.post('/', protect, leaderOrSuperAdmin, requireApprovedSession, createExpense);
router.put('/:id', protect, leaderOrSuperAdmin, requireApprovedSession, updateExpense);
router.delete('/:id', protect, leaderOrSuperAdmin, requireApprovedSession, deleteExpense);

module.exports = router;

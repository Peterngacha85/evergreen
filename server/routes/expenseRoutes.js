const express = require('express');
const router = express.Router();
const { getAllExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const { leaderOrSuperAdmin } = require('../middleware/roleMiddleware');

router.get('/', protect, getAllExpenses);
router.post('/', protect, leaderOrSuperAdmin, createExpense);
router.put('/:id', protect, leaderOrSuperAdmin, updateExpense);
router.delete('/:id', protect, leaderOrSuperAdmin, deleteExpense);

module.exports = router;

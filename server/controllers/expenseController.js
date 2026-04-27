const Expense = require('../models/Expense');

// @desc  Get all expenses
// @route GET /api/expenses
// @access Private (Member, Leader, SuperAdmin)
const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Create an expense
// @route POST /api/expenses
// @access Private (Leader, SuperAdmin)
const createExpense = async (req, res) => {
  try {
    const { title, description, amount, date, category } = req.body;
    
    if (!title || !amount) {
      return res.status(400).json({ message: 'Title and amount are required' });
    }

    const expense = await Expense.create({
      title,
      description,
      amount,
      date,
      category,
      addedBy: req.user.name || req.role
    });

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update an expense
// @route PUT /api/expenses/:id
// @access Private (Leader, SuperAdmin)
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Delete an expense
// @route DELETE /api/expenses/:id
// @access Private (Leader, SuperAdmin)
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    await expense.deleteOne();
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense
};

const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { authenticate } = require('./auth');

// Set or update budget for the current month
router.post('/', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount === undefined || amount < 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId, month, year },
      { amount },
      { new: true, upsert: true }
    );

    res.json(budget);
  } catch (error) {
    console.error('Budget POST Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete budget for the current month
router.delete('/', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    await Budget.findOneAndDelete({ userId: req.userId, month, year });
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Budget DELETE Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get budget status and calculate spending
router.get('/status', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Find the budget for the current month
    const budget = await Budget.findOne({ userId: req.userId, month, year });
    const totalBudget = budget ? budget.amount : null;

    // Calculate start and end of the current month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Find expenses created in the current month where the user is an involved member
    const expenses = await Expense.find({
      date: { $gte: startOfMonth, $lte: endOfMonth },
      'involvedMembers.userId': req.userId
    });

    // Sum the user's split amount from those expenses
    let totalSpent = 0;
    expenses.forEach(exp => {
      const memberData = exp.involvedMembers.find(
        m => String(m.userId) === String(req.userId)
      );
      if (memberData) {
        totalSpent += memberData.amountOwed;
      }
    });

    if (totalBudget === null) {
      return res.json({
        totalBudget: null,
        totalSpent,
        remainingBudget: null,
        percentageUsed: 0
      });
    }

    const remainingBudget = Math.max(0, totalBudget - totalSpent);
    const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    res.json({
      totalBudget,
      totalSpent,
      remainingBudget,
      percentageUsed
    });
  } catch (error) {
    console.error('Budget GET Status Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const { authenticate } = require('./auth');
const { updateNetBalance } = require('../utils/debtEngine');

// Add a new expense
router.post('/', authenticate, async (req, res) => {
  try {
    const { groupId, amount, description, involvedMembers, payerId } = req.body;
    
    // involvedMembers is an array of { userId, amountOwed }
    
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.includes(req.userId)) return res.status(403).json({ error: 'Not a member of this group' });

    // Validate members
    const allInvolvedUserIds = involvedMembers.map(m => m.userId);
    for (const uId of allInvolvedUserIds) {
      if (!group.members.includes(uId)) {
        return res.status(400).json({ error: `User ${uId} is not a member of the group` });
      }
    }

    const actualPayerId = payerId || req.userId;

    // Ensure the payer's split is automatically marked as paid
    const processedInvolvedMembers = involvedMembers.map(m => {
      if (String(m.userId) === String(actualPayerId)) {
        return { ...m, paymentStatus: 'PAID_ONLINE' };
      }
      // Ensure others default to PENDING
      return { ...m, paymentStatus: 'PENDING' };
    });

    const expense = new Expense({
      groupId,
      creatorId: actualPayerId,
      amount,
      description,
      involvedMembers: processedInvolvedMembers
    });
    
    await expense.save();

    // Update Net Balances via Debt Engine
    for (const member of involvedMembers) {
      if (member.userId !== actualPayerId) {
        // actualPayerId paid, member.userId owes actualPayerId
        await updateNetBalance(actualPayerId, member.userId, member.amountOwed);
      }
    }

    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get expenses for a group (Privacy Enforced)
router.get('/:groupId', authenticate, async (req, res) => {
  try {
    const expenses = await Expense.find({ groupId: req.params.groupId })
      .sort({ createdAt: -1 })
      .populate('creatorId', 'name email')
      .populate('involvedMembers.userId', 'name email');

    // Filter to only return expenses where the user is involved or is the creator
    const visibleExpenses = expenses.filter(exp => {
      if (exp.creatorId._id.toString() === req.userId) return true;
      return exp.involvedMembers.some(m => m.userId._id.toString() === req.userId);
    });

    res.json(visibleExpenses);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark a specific user's split as paid for an expense
router.post('/:expenseId/pay/:userId', authenticate, async (req, res) => {
  try {
    const { expenseId, userId } = req.params;
    const { method } = req.body; // 'ONLINE' or 'PHYSICAL'
    
    if (!['ONLINE', 'PHYSICAL'].includes(method)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    
    // Only the creator (payer) or the person themselves can mark it as paid. 
    if (expense.creatorId.toString() !== req.userId && userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to mark this as paid' });
    }

    const memberSplit = expense.involvedMembers.find(m => m.userId.toString() === userId);
    if (!memberSplit) return res.status(404).json({ error: 'User not involved in this expense' });
    
    if (memberSplit.paymentStatus !== 'PENDING') {
      return res.status(400).json({ error: 'Already marked as paid' });
    }

    memberSplit.paymentStatus = method === 'ONLINE' ? 'PAID_ONLINE' : 'PAID_PHYSICALLY';
    await expense.save();

    // Now update the global Net Balance
    await updateNetBalance(userId, expense.creatorId, memberSplit.amountOwed);

    res.json({ message: 'Marked as paid and balance settled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

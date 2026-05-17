const express = require('express');
const router = express.Router();
const NetBalance = require('../models/NetBalance');
const Expense = require('../models/Expense');
const { authenticate } = require('./auth');
const { updateNetBalance } = require('../utils/debtEngine');

// Get personalized dashboard data (sorted balances)
router.get('/', authenticate, async (req, res) => {
  try {
    // Find all balances where the user is either userA or userB
    const balances = await NetBalance.find({
      $or: [{ userA: req.userId }, { userB: req.userId }]
    }).populate('userA', 'name email upiId').populate('userB', 'name email upiId');

    // Format the response for the frontend
    const formattedBalances = balances.map(b => {
      let isOwedToMe = false;
      let amount = 0;
      let otherUser = null;

      const isUserA = b.userA._id.toString() === req.userId;

      // Recall convention: positive netAmount means userA owes userB
      if (isUserA) {
        otherUser = b.userB;
        if (b.netAmount > 0) {
          // I am userA, I owe userB
          isOwedToMe = false;
          amount = b.netAmount;
        } else if (b.netAmount < 0) {
          // I am userA, userB owes me
          isOwedToMe = true;
          amount = Math.abs(b.netAmount);
        }
      } else {
        otherUser = b.userA;
        if (b.netAmount > 0) {
          // I am userB, userA owes me
          isOwedToMe = true;
          amount = b.netAmount;
        } else if (b.netAmount < 0) {
          // I am userB, I owe userA
          isOwedToMe = false;
          amount = Math.abs(b.netAmount);
        }
      }

      return {
        otherUser,
        amount,
        isOwedToMe,
        netAmount: isOwedToMe ? amount : -amount // useful for sorting
      };
    }).filter(b => b.amount !== 0);

    // Priority Sorting: sort debts in descending order showing the highest total net amount owed to an individual first.
    // If I owe them (netAmount is negative), maybe show those first? Wait, "highest total net amount owed to an individual first".
    // I'll sort by absolute amount descending.
    formattedBalances.sort((a, b) => b.amount - a.amount);

    res.json(formattedBalances);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark as Paid
router.post('/pay', authenticate, async (req, res) => {
  try {
    const { payeeId, amount } = req.body; 

    await updateNetBalance(req.userId, payeeId, amount);

    // Sweep and mark all pending expenses between these two users as settled (PAID_ONLINE)
    // because the dashboard payment settles their entire net balance.
    const Expense = require('../models/Expense');
    const expensesToSettle = await Expense.find({
      $or: [
        { creatorId: payeeId, 'involvedMembers.userId': req.userId, 'involvedMembers.paymentStatus': 'PENDING' },
        { creatorId: req.userId, 'involvedMembers.userId': payeeId, 'involvedMembers.paymentStatus': 'PENDING' }
      ]
    });

    for (const exp of expensesToSettle) {
      let split;
      if (exp.creatorId.toString() === payeeId) {
        split = exp.involvedMembers.find(m => m.userId.toString() === req.userId && m.paymentStatus === 'PENDING');
      } else {
        split = exp.involvedMembers.find(m => m.userId.toString() === payeeId && m.paymentStatus === 'PENDING');
      }

      if (split) {
        split.paymentStatus = 'PAID_ONLINE';
        await exp.save();
      }
    }

    res.json({ message: 'Payment recorded, balance netted, and specific expenses marked as paid' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Personal Payment Insights: "Where My Money Goes"
// Returns lifetime total the logged-in user has ever paid for each other member,
// grouped by group and sorted highest → lowest within each group.
router.get('/insights', authenticate, async (req, res) => {
  try {
    const Expense = require('../models/Expense');

    // Fetch all expenses where the current user is INVOLVED but NOT the creator
    // This represents expenses where the user owes or paid money TO the creator
    const expenses = await Expense.find({
      'involvedMembers.userId': req.userId,
      creatorId: { $ne: req.userId }
    })
      .populate('groupId', 'name')
      .populate('creatorId', 'name'); // The person to whom the money is owed/paid

    // Structure: { [groupId]: { groupId, groupName, members: { [creatorId]: { name, totalPaid } } } }
    const groupMap = {};

    expenses.forEach(exp => {
      if (!exp.groupId) return;

      const gId  = exp.groupId._id.toString();
      const gName = exp.groupId.name;

      if (!groupMap[gId]) {
        groupMap[gId] = { groupId: gId, groupName: gName, members: {} };
      }

      // The member we are sending money to is the CREATOR of the expense
      if (!exp.creatorId) return;
      const mId = exp.creatorId._id.toString();

      if (!groupMap[gId].members[mId]) {
        groupMap[gId].members[mId] = {
          userId: mId,
          name: exp.creatorId.name,
          totalPaid: 0,
        };
      }

      // Find the current user's split in this expense
      const mySplit = exp.involvedMembers.find(m => m.userId.toString() === req.userId);
      if (mySplit) {
        // "total sum how much I paid to each member in all splits"
        // We sum the amount the user was responsible for in this split
        groupMap[gId].members[mId].totalPaid += mySplit.amountOwed;
      }
    });

    // Convert to array, sort members within each group high → low, drop empty groups
    const result = Object.values(groupMap)
      .map(group => ({
        groupId:   group.groupId,
        groupName: group.groupName,
        members: Object.values(group.members)
          .filter(m => m.totalPaid > 0)
          .sort((a, b) => b.totalPaid - a.totalPaid),
      }))
      .filter(g => g.members.length > 0)
      // Sort groups so the group with the highest single member amount comes first
      .sort((a, b) => (b.members[0]?.totalPaid || 0) - (a.members[0]?.totalPaid || 0));

    res.json(result);
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// Time-Based Expense Analytics
// GET /api/dashboard/analytics?view=daily|monthly|yearly
// Returns the current user's personal spending aggregated by time.
// ─────────────────────────────────────────────────────────────────
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const { view = 'daily' } = req.query;
    const userId = req.userId;
    const mongoose = require('mongoose');
    const userObjId = new mongoose.Types.ObjectId(userId);

    const now = new Date();

    // ── Helper: compute the personal amount for a single expense doc
    // If the user was the creator they paid the full bill; their "share" is
    // what they personally owed in involvedMembers (their own split entry).
    // If they were only a participant, their share is their amountOwed entry.

    if (view === 'daily' || view === 'weekly') {
      // Last 7 complete days (Mon-Sun of current week relative to today)
      const startOfWeek = new Date(now);
      // Go back to the last Monday (or today if Monday)
      const day = startOfWeek.getDay(); // 0=Sun,1=Mon,...
      const diffToMonday = (day === 0 ? -6 : 1 - day);
      startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      // Fetch all relevant expenses in that range
      const expenses = await Expense.find({
        createdAt: { $gte: startOfWeek, $lt: endOfWeek },
        $or: [
          { creatorId: userObjId },
          { 'involvedMembers.userId': userObjId }
        ]
      });

      // Aggregate by day-of-week index (0=Mon…6=Sun)
      const buckets = Array(7).fill(0);
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      expenses.forEach(exp => {
        const d = new Date(exp.createdAt);
        // Compute bucket index: 0=Mon,6=Sun
        const rawDay = d.getDay(); // 0=Sun
        const idx = rawDay === 0 ? 6 : rawDay - 1;

        // Find user's personal share
        const myMember = exp.involvedMembers.find(
          m => m.userId.toString() === userId
        );
        const amount = myMember ? myMember.amountOwed : 0;
        buckets[idx] += amount;
      });

      const data = labels.map((label, i) => ({
        label,
        amount: Math.round(buckets[i] * 100) / 100,
        isToday: (() => {
          const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
          return i === todayIdx;
        })()
      }));

      const total = buckets.reduce((a, b) => a + b, 0);
      const avg = total / 7;
      const peak = labels[buckets.indexOf(Math.max(...buckets))];

      return res.json({ view: 'daily', data, total: Math.round(total * 100) / 100, avg: Math.round(avg * 100) / 100, peak });
    }

    if (view === 'monthly') {
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-indexed
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 1);

      const expenses = await Expense.find({
        createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        $or: [
          { creatorId: userObjId },
          { 'involvedMembers.userId': userObjId }
        ]
      });

      // Bucket by day-of-month (1-indexed)
      const buckets = Array(daysInMonth).fill(0);

      expenses.forEach(exp => {
        const d = new Date(exp.createdAt);
        const dayIdx = d.getDate() - 1; // 0-indexed
        const myMember = exp.involvedMembers.find(
          m => m.userId.toString() === userId
        );
        const amount = myMember ? myMember.amountOwed : 0;
        buckets[dayIdx] += amount;
      });

      // Build cumulative running total for area chart
      let running = 0;
      const data = buckets.map((amt, i) => {
        running += amt;
        return {
          label: i + 1,        // day number
          amount: Math.round(amt * 100) / 100,
          cumulative: Math.round(running * 100) / 100
        };
      });

      const total = running;
      const avg = total / daysInMonth;
      const peakDay = buckets.indexOf(Math.max(...buckets)) + 1;

      return res.json({ view: 'monthly', data, total: Math.round(total * 100) / 100, avg: Math.round(avg * 100) / 100, peakDay });
    }

    if (view === 'yearly') {
      const year = now.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);

      const expenses = await Expense.find({
        createdAt: { $gte: startOfYear, $lt: endOfYear },
        $or: [
          { creatorId: userObjId },
          { 'involvedMembers.userId': userObjId }
        ]
      });

      const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const buckets = Array(12).fill(0);

      expenses.forEach(exp => {
        const m = new Date(exp.createdAt).getMonth();
        const myMember = exp.involvedMembers.find(
          mem => mem.userId.toString() === userId
        );
        const amount = myMember ? myMember.amountOwed : 0;
        buckets[m] += amount;
      });

      const data = MONTHS.map((label, i) => ({
        label,
        amount: Math.round(buckets[i] * 100) / 100
      }));

      const total = buckets.reduce((a, b) => a + b, 0);
      const avg = total / 12;
      const peakMonth = MONTHS[buckets.indexOf(Math.max(...buckets))];

      return res.json({ view: 'yearly', data, total: Math.round(total * 100) / 100, avg: Math.round(avg * 100) / 100, peakMonth });
    }

    return res.status(400).json({ error: 'Invalid view parameter. Use daily, monthly, or yearly.' });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

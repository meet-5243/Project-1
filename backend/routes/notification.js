const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const { authenticate } = require('./auth');

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(404).json({ error: 'VAPID public key not configured' });
  }
  res.json({ publicKey });
});

// Subscribe to push notifications
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    // Deduplicate subscriptions based on endpoint URL
    const existing = await PushSubscription.findOne({ 'subscription.endpoint': subscription.endpoint });
    if (existing) {
      existing.userId = req.userId;
      existing.subscription = subscription;
      await existing.save();
    } else {
      await PushSubscription.create({
        userId: req.userId,
        subscription
      });
    }

    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

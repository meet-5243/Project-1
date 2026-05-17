const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const { authenticate } = require('./auth');

// Create a group
router.post('/', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    const group = new Group({
      name,
      creator: req.userId,
      members: [req.userId],
      pendingInvites: []
    });
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Invite a user to a group
router.post('/:groupId/invite', authenticate, async (req, res) => {
  try {
    const { email } = req.body;
    const userToInvite = await User.findOne({ email });
    if (!userToInvite) return res.status(404).json({ error: 'User not found' });

    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.includes(req.userId)) return res.status(403).json({ error: 'Not a member' });

    if (group.members.includes(userToInvite._id)) {
      return res.status(400).json({ error: 'User already in group' });
    }
    if (group.pendingInvites.includes(userToInvite._id)) {
      return res.status(400).json({ error: 'User already invited' });
    }

    group.pendingInvites.push(userToInvite._id);
    await group.save();
    res.json({ message: 'User invited successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept invite
router.post('/:groupId/accept', authenticate, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.pendingInvites.includes(req.userId)) {
      return res.status(403).json({ error: 'No pending invite for this group' });
    }

    // Remove from pending, add to members
    group.pendingInvites = group.pendingInvites.filter(id => id.toString() !== req.userId);
    group.members.push(req.userId);
    await group.save();

    res.json({ message: 'Joined group successfully', group });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's groups and pending invites
router.get('/', authenticate, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId }).populate('members', 'name email').populate('pendingInvites', 'name email');
    const pendingInvites = await Group.find({ pendingInvites: req.userId }).populate('members', 'name email');
    res.json({ groups, pendingInvites });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

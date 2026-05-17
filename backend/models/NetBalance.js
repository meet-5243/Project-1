const mongoose = require('mongoose');

// This tracks the net balance between two users across all groups.
// If userA owes userB ₹50, netAmount is positive.
// By convention, we'll store userA as the lexically smaller ObjectId to ensure uniqueness.
const netBalanceSchema = new mongoose.Schema({
  userA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userB: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  netAmount: { type: Number, required: true, default: 0 }, // Positive means A owes B, Negative means B owes A.
}, { timestamps: true });

netBalanceSchema.index({ userA: 1, userB: 1 }, { unique: true });

module.exports = mongoose.model('NetBalance', netBalanceSchema);

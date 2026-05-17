const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who paid
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  involvedMembers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amountOwed: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID_ONLINE', 'PAID_PHYSICALLY'], default: 'PENDING' }
  }],
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);

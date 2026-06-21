const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  payerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  payeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['SETTLED', 'DISPUTED', 'RESOLVED'], default: 'SETTLED' },
  sweptExpenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }],
  disputeExpiresAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Settlement', settlementSchema);

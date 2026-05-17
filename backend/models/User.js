const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  upiId: { type: String }, // e.g., user@oksbi
  qrCodeUrl: { type: String }, // optional QR code image URL
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

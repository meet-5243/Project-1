const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const OTP = require('../models/OTP');

const JWT_SECRET = process.env.JWT_SECRET || 'hostel-secret-key';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Middleware to authenticate
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/send-otp', async (req, res) => {
  try {
    const { email, type = 'signup' } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const existingUser = await User.findOne({ email });
    
    if (type === 'signup' && existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    if (type === 'password_change' && !existingUser) {
      return res.status(400).json({ error: 'User not found' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any existing OTP for this email
    await OTP.deleteMany({ email });

    const otpRecord = new OTP({ email, otp: otpCode });
    await otpRecord.save();

    await transporter.sendMail({
      from: `"HostelSplit" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔑 Your HostelSplit OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px; border-radius: 16px; max-width: 480px; margin: auto;">
          <h1 style="background: linear-gradient(to right, #34d399, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; margin-bottom: 8px;">HostelSplit</h1>
          <p style="color: #9ca3af; margin-bottom: 32px;">Email Verification</p>
          <div style="background-color: #1a1a1a; border: 1px solid #2d2d2d; border-radius: 12px; padding: 32px; text-align: center;">
            <p style="color: #d1d5db; margin-bottom: 16px;">Your One-Time Password is:</p>
            <div style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #34d399; margin: 16px 0;">${otpCode}</div>
            <p style="color: #6b7280; font-size: 13px;">This OTP is valid for <strong style="color: #9ca3af;">10 minutes</strong>. Do not share it with anyone.</p>
          </div>
          <p style="color: #4b5563; font-size: 12px; margin-top: 24px; text-align: center;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ error: 'Error sending OTP' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, upiId, qrCodeUrl, otp } = req.body;
    
    if (!otp) return res.status(400).json({ error: 'OTP is required' });

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) return res.status(400).json({ error: 'OTP expired or not requested' });
    if (otpRecord.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, upiId, qrCodeUrl });
    await user.save();

    await OTP.deleteMany({ email }); // Clear OTP after successful registration

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, upiId: user.upiId } });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, upiId: user.upiId } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/me', authenticate, async (req, res) => {
  try {
    const { name, email, password, upiId, otp } = req.body;
    
    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.userId } });
      if (existingUser) return res.status(400).json({ error: 'Email already in use by another account' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (upiId !== undefined) updateData.upiId = upiId;
    
    if (password) {
      const currentUser = await User.findById(req.userId);
      if (!otp) return res.status(400).json({ error: 'OTP is required to change password' });

      const otpRecord = await OTP.findOne({ email: currentUser.email });
      if (!otpRecord) return res.status(400).json({ error: 'OTP expired or not requested' });
      if (otpRecord.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

      updateData.password = await bcrypt.hash(password, 10);
      await OTP.deleteMany({ email: currentUser.email }); // Clear OTP
    }

    const updatedUser = await User.findByIdAndUpdate(req.userId, updateData, { new: true }).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = { router, authenticate };

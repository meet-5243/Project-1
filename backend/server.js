const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://project-1-orcin-omega.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Routes
const { router: authRoutes } = require('./routes/auth');
app.use('/api/auth', authRoutes);
app.use('/api/groups', require('./routes/groups'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/notifications', require('./routes/notification'));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/clearsync';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Migration: Update existing expenses to set date = createdAt if date is missing
    try {
      const Expense = require('./models/Expense');
      const expenses = await Expense.find({ date: { $exists: false } });
      let migratedCount = 0;
      for (const exp of expenses) {
        exp.date = exp.createdAt || new Date();
        await exp.save();
        migratedCount++;
      }
      if (migratedCount > 0) {
        console.log(`Migrated ${migratedCount} expenses to have date = createdAt`);
      }
    } catch (err) {
      console.error('Migration error:', err);
    }

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));

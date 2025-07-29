// backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth'); // Correctly imports the router from auth.js
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// This line correctly tells the app to use your authRoutes for any path starting with /api/auth
app.use('/api/auth', authRoutes);

// Database connection
// Note: Mongoose 6+ no longer needs these options
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 8000; // Changed default port to 8000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

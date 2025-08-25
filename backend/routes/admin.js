const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Get all users (for admin/debugging)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password field
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get user count
router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const usersWithEmail = await User.countDocuments({ email: { $exists: true, $ne: null } });
    const usersWithPhone = await User.countDocuments({ phone: { $exists: true, $ne: null } });
    
    res.json({
      success: true,
      stats: {
        totalUsers: userCount,
        usersWithEmail: usersWithEmail,
        usersWithPhone: usersWithPhone
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
});

// Find user by email or phone
router.get('/user/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    }, '-password'); // Exclude password
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Error finding user:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding user',
      error: error.message
    });
  }
});

module.exports = router;

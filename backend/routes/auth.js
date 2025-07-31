const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();

// User signup route
router.post('/signup', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    
    console.log('Signup request received:', { email, phone, password: '***' });
    
    // Validation
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    if (!email && !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Either email or phone number is required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        email ? { email: email.toLowerCase() } : null,
        phone ? { phone } : null
      ].filter(Boolean)
    });
    
    if (existingUser) {
      const field = existingUser.email === email?.toLowerCase() ? 'Email' : 'Phone number';
      return res.status(400).json({ 
        success: false, 
        message: `${field} already registered` 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = new User({
      email: email ? email.toLowerCase() : undefined,
      phone: phone || undefined,
      password: hashedPassword
    });
    
    await newUser.save();
    console.log('User created successfully:', newUser._id);
    
    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        phone: newUser.phone
      }
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// User login route
router.post('/login', async (req, res) => {
  try {
    const { emailPhone, password } = req.body;
    
    console.log('Login request received:', { emailPhone, password: '***' });
    
    if (!emailPhone || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email/phone and password are required' 
      });
    }
    
    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: emailPhone.toLowerCase() },
        { phone: emailPhone }
      ]
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    console.log('User logged in successfully:', user._id);
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Development route to view all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude passwords
    res.json({ 
      success: true, 
      users,
      count: users.length 
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
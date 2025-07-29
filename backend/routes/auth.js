const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/auth/users - View all users (for development/testing)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password from response
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users' 
    });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, emailPhone, password } = req.body;

    // Validate required fields
    if (!name || !emailPhone || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, email/phone, and password' 
      });
    }

    // Function to detect if input is email or phone
    const isEmail = (str) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(str);
    };

    const isPhone = (str) => {
      // Remove all non-digit characters and check if it's a valid phone number
      const cleanedPhone = str.replace(/\D/g, '');
      // Check if it's between 10-15 digits (most phone numbers)
      return cleanedPhone.length >= 10 && cleanedPhone.length <= 15;
    };

    let email = null;
    let phone = null;

    if (isEmail(emailPhone)) {
      email = emailPhone;
    } else if (isPhone(emailPhone)) {
      phone = emailPhone;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email or phone number' 
      });
    }

    // Check if user already exists
    const query = email ? { email } : { phone };
    const existingUser = await User.findOne(query);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email/phone' 
      });
    }

    // Create new user
    const userData = {
      name,
      password
    };
    
    if (email) userData.email = email;
    if (phone) userData.phone = phone;

    const user = new User(userData);

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during signup' 
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { emailPhone, password } = req.body;
    
    console.log('Login attempt with:', { emailPhone, password: '***' });

    // Validate required fields
    if (!emailPhone || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email/phone and password' 
      });
    }

    // Function to detect if input is email or phone
    const isEmail = (str) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(str);
    };

    const isPhone = (str) => {
      // Remove all non-digit characters and check if it's a valid phone number
      const cleanedPhone = str.replace(/\D/g, '');
      // Check if it's between 10-15 digits (most phone numbers)
      return cleanedPhone.length >= 10 && cleanedPhone.length <= 15;
    };

    console.log('isEmail result:', isEmail(emailPhone));
    console.log('isPhone result:', isPhone(emailPhone));

    // Find user by email or phone
    let user;
    if (isEmail(emailPhone)) {
      console.log('Searching by email:', emailPhone);
      user = await User.findOne({ email: emailPhone });
    } else if (isPhone(emailPhone)) {
      console.log('Searching by phone:', emailPhone);
      // Search in both phone field (new) and email field (old data)
      user = await User.findOne({ 
        $or: [
          { phone: emailPhone },
          { email: emailPhone }
        ]
      });
    } else {
      console.log('Invalid format - not email or phone:', emailPhone);
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email or phone number' 
      });
    }

    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
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

module.exports = router;
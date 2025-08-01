const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { sendWelcomeEmail, testEmailConnection } = require('../services/emailService');
const router = express.Router();

// User signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    console.log('Signup request received:', { name, email, phone, password: '***' });
    
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
      name: name || undefined,
      email: email ? email.toLowerCase() : undefined,
      phone: phone || undefined,
      password: hashedPassword
    });
    
    await newUser.save();
    console.log('User created successfully:', newUser._id);
    
    // Send welcome email if user provided an email
    if (email) {
      try {
        console.log('Sending welcome email to:', email);
        const emailResult = await sendWelcomeEmail(email);
        
        if (emailResult.success) {
          console.log('Welcome email sent successfully to:', email);
        } else {
          console.log('Failed to send welcome email:', emailResult.error);
          // Note: We don't fail the signup if email fails
        }
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Continue with successful signup even if email fails
      }
    }
    
    res.status(201).json({ 
      success: true, 
      message: email ? 'User registered successfully! Please check your email for a welcome message.' : 'User registered successfully!',
      user: {
        id: newUser._id,
        name: newUser.name,
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

// Test email service
router.get('/test-email', async (req, res) => {
  try {
    const isConnected = await testEmailConnection();
    res.json({ 
      success: true, 
      emailServiceConnected: isConnected,
      message: isConnected ? 'Email service is working!' : 'Email service connection failed'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error testing email service',
      error: error.message 
    });
  }
});

// Send test welcome email
router.post('/test-welcome-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const result = await sendWelcomeEmail(email);
    
    res.json({
      success: result.success,
      message: result.success ? 'Test welcome email sent successfully!' : 'Failed to send test email',
      messageId: result.messageId,
      error: result.error
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: error.message
    });
  }
});

module.exports = router;
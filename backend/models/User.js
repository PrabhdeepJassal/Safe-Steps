const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  email: { 
    type: String, 
    unique: true, 
    sparse: true,  // Allows multiple documents without email
    lowercase: true 
  },
  phone: { 
    type: String, 
    unique: true, 
    sparse: true   // Allows multiple documents without phone
  },
  password: { 
    type: String, 
    required: true 
  }
}, {
  timestamps: true
});

// Ensure at least one of email or phone is provided
UserSchema.pre('validate', function(next) {
  if (!this.email && !this.phone) {
    next(new Error('Either email or phone number is required'));
  } else {
    next();
  }
});

module.exports = mongoose.model('User', UserSchema);
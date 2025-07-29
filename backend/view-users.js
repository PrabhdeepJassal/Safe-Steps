const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  viewUsers();
}).catch(err => console.error('MongoDB connection error:', err));

// Import User model
const User = require('./models/User');

async function viewUsers() {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password
    console.log('\n=== USERS IN DATABASE ===');
    console.log(`Total users: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Created: ${user.createdAt || 'Not available'}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }
}

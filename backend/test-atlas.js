const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB Atlas connection...');
console.log('Connection string:', process.env.MONGO_URI.replace(/:[^:]*@/, ':***@'));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB Atlas connected successfully!');
  console.log('🌍 Your database is now globally accessible!');
  process.exit(0);
}).catch(err => {
  console.error('❌ MongoDB Atlas connection error:', err.message);
  console.log('\n🔍 Common issues:');
  console.log('1. Check if password in connection string is correct');
  console.log('2. Ensure IP address is whitelisted (0.0.0.0/0 for anywhere)');
  console.log('3. Verify cluster is running and accessible');
  process.exit(1);
});

// Test MongoDB connection with improved error handling
console.log('🧪 Testing MongoDB connection...');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { connectDB } = require('./lib/mongodb.js');

async function testConnection() {
  try {
    console.log('📋 Connection Details:');
    console.log('MongoDB URI:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    console.log('');

    console.log('🔄 Attempting connection...');
    const { client, db } = await connectDB();
    
    console.log('✅ Connection successful!');
    
    // Test database operations
    console.log('🧪 Testing database operations...');
    
    // Test collections access
    const collections = await db.listCollections().toArray();
    console.log(`📁 Found ${collections.length} collections:`, collections.map(c => c.name));
    
    // Test users collection
    const usersCount = await db.collection('users').countDocuments();
    console.log(`👥 Users collection: ${usersCount} documents`);
    
    // Test a simple query
    const sampleUser = await db.collection('users').findOne({});
    if (sampleUser) {
      console.log(`👤 Sample user found: ${sampleUser.email || sampleUser.name || 'No email/name'}`);
    } else {
      console.log('👤 No users found in collection');
    }
    
    console.log('');
    console.log('🎉 All tests passed! MongoDB connection is working perfectly.');
    
    // Test the connection health
    console.log('');
    console.log('❤️ Testing connection health...');
    await db.admin().ping();
    console.log('✅ Connection health check passed');
    
  } catch (error) {
    console.error('');
    console.error('❌ MongoDB connection test failed!');
    console.error('Error:', error.message);
    console.error('');
    
    // Provide troubleshooting steps
    console.log('🔧 Troubleshooting steps:');
    
    if (error.message.includes('authentication failed')) {
      console.log('1. ✓ Check your MongoDB username and password');
      console.log('2. ✓ Ensure the user has proper database permissions');
      console.log('3. ✓ Verify the database name in your connection string');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('1. ✓ Check your internet connection');
      console.log('2. ✓ Verify the MongoDB cluster hostname');
      console.log('3. ✓ Ensure your IP is whitelisted in MongoDB Atlas');
    } else if (error.message.includes('ECONNRESET') || error.message.includes('connection was reset')) {
      console.log('1. ✓ Check if MongoDB Atlas cluster is running');
      console.log('2. ✓ Verify your IP is whitelisted (0.0.0.0/0 for development)');
      console.log('3. ✓ Try restarting your application');
      console.log('4. ✓ Check MongoDB Atlas status page');
    } else if (error.message.includes('timeout')) {
      console.log('1. ✓ Check your network connection speed');
      console.log('2. ✓ Try increasing timeout values');
      console.log('3. ✓ Verify MongoDB cluster region/location');
    }
    
    console.log('');
    console.log('📞 If problems persist:');
    console.log('- Check MongoDB Atlas dashboard');
    console.log('- Verify cluster status and configuration');
    console.log('- Check network access settings');
    
    process.exit(1);
  }
}

// Run the test
testConnection().then(() => {
  console.log('');
  console.log('🏁 Connection test completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error.message);
  process.exit(1);
});
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 30000,
  family: 4,
  retryWrites: true,
  retryReads: true,
  tls: true
};

async function testConnection() {
  console.log('🔄 Testing MongoDB connection...');
  console.log('📍 URI:', uri ? uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'Not found');
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  const client = new MongoClient(uri, options);
  
  try {
    console.log('🔄 Attempting to connect...');
    await client.connect();
    console.log('✅ Connected successfully to MongoDB!');
    
    // Test a simple operation
    const adminDb = client.db().admin();
    await adminDb.ping();
    console.log('✅ Ping successful!');
    
    // List databases to verify access
    const dbs = await adminDb.listDatabases();
    console.log('📂 Available databases:', dbs.databases.map(db => db.name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
      console.error('🔐 Authentication issue - check username/password');
    } else if (error.message.includes('Server selection timed out')) {
      console.error('⏰ Connection timeout - check network/firewall');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🌐 DNS resolution failed - check the hostname');
    }
    
  } finally {
    await client.close();
    console.log('🔒 Connection closed');
  }
}

testConnection();
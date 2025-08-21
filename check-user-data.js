require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function checkUserData() {
  console.log('🔄 Checking user data in MongoDB...');
  
  const client = new MongoClient(uri, {
    tls: true,
    serverSelectionTimeoutMS: 30000
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Check users collection
    console.log('\n📋 Checking users collection:');
    const users = await db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ID: ${user._id}, Email: ${user.email}, Name: ${user.name}`);
    });
    
    // Check files collection
    console.log('\n📁 Checking files collection:');
    const files = await db.collection('files').find({}).toArray();
    console.log(`Found ${files.length} files:`);
    files.forEach(file => {
      console.log(`- ID: ${file._id}, UserId: ${file.userId}, Filename: ${file.filename}, Status: ${file.status}`);
    });
    
    // Check if there are files for the specific user
    if (users.length > 0) {
      const userId = users[0]._id.toString();
      console.log(`\n🔍 Checking files for user ${userId}:`);
      const userFiles = await db.collection('files').find({ userId }).toArray();
      console.log(`Found ${userFiles.length} files for this user`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkUserData();
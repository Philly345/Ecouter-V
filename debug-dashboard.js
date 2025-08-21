// This script will help debug the dashboard API issue
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function debugDashboard() {
  console.log('🔍 Debugging dashboard user data issue...');
  
  const client = new MongoClient(process.env.MONGODB_URI, {
    tls: true,
    serverSelectionTimeoutMS: 30000
  });
  
  try {
    await client.connect();
    const db = client.db();
    
    // Find the user that matches the email from the screenshot
    console.log('\n👤 Looking for users with "lowkey" or "philbert" in email:');
    const users = await db.collection('users').find({
      $or: [
        { email: /lowkey/i },
        { email: /philbert/i }
      ]
    }).toArray();
    
    users.forEach(user => {
      console.log(`- ID: ${user._id}, Email: ${user.email}, Name: ${user.name}`);
    });
    
    // Check files for the specific user that should be logged in
    const targetUserId = '688a515c0cb49c558609f783'; // lowkeyphilly17@gmail.com
    console.log(`\n📁 Checking files for user ${targetUserId} (lowkeyphilly17@gmail.com):`);
    
    const userFiles = await db.collection('files').find({ userId: targetUserId }).toArray();
    console.log(`Found ${userFiles.length} files for this user`);
    
    if (userFiles.length > 0) {
      console.log('\n📊 File statistics:');
      const completed = userFiles.filter(f => f.status === 'completed').length;
      const processing = userFiles.filter(f => f.status === 'processing').length;
      const error = userFiles.filter(f => f.status === 'error').length;
      
      console.log(`- Completed: ${completed}`);
      console.log(`- Processing: ${processing}`);
      console.log(`- Error: ${error}`);
      console.log(`- Total: ${userFiles.length}`);
      
      // Show recent files
      console.log('\n📄 Recent files (last 5):');
      const recentFiles = userFiles
        .sort((a, b) => new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id))
        .slice(0, 5);
      
      recentFiles.forEach(file => {
        console.log(`- ${file.filename || 'No filename'} (${file.status}) - ${file.createdAt || 'No date'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugDashboard();
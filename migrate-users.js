const { MongoClient } = require('mongodb');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function migrateUsers() {
  const mongoUri = 'mongodb+srv://phillyrick34:vQurr3PtaaARNYUq@cluster0.u48pyr3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(mongoUri);
  
  try {
    console.log('🔄 Starting user migration...');
    
    // Read users from file
    const usersData = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
    console.log(`📄 Found ${usersData.length} users in file`);
    
    // Connect to MongoDB
    await client.connect();
    const db = client.db();
    console.log('🔗 Connected to MongoDB');
    
    // Check existing users
    const existingUsers = await db.collection('users').find({}).toArray();
    console.log(`💾 Found ${existingUsers.length} users in MongoDB`);
    
    // Migrate users that don't exist in MongoDB
    let migratedCount = 0;
    
    for (const user of usersData) {
      const existingUser = await db.collection('users').findOne({ email: user.email });
      
      if (!existingUser) {
        // Convert file user to MongoDB format
        const mongoUser = {
          name: user.name,
          email: user.email,
          ...(user.password && { password: user.password }),
          ...(user.provider && { provider: user.provider }),
          ...(user.googleId && { googleId: user.googleId }),
          ...(user.avatar && { avatar: user.avatar }),
          verified: user.verified || user.provider === 'google' || false,
          storageUsed: user.storageUsed || 0,
          transcriptionsCount: user.transcriptionsCount || 0,
          minutesUsed: user.minutesUsed || 0,
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: user.updatedAt || new Date().toISOString()
        };
        
        await db.collection('users').insertOne(mongoUser);
        console.log(`✅ Migrated user: ${user.email}`);
        migratedCount++;
      } else {
        console.log(`⏭️  User already exists: ${user.email}`);
      }
    }
    
    console.log(`🎉 Migration complete! Migrated ${migratedCount} users`);
    
    // Verify the specific user
    const targetUser = await db.collection('users').findOne({ email: 'phillyrick34@gmail.com' });
    console.log('🔍 Target user found:', !!targetUser);
    if (targetUser) {
      console.log('👤 User details:', JSON.stringify(targetUser, null, 2));
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrateUsers();

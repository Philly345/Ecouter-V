// Test script for cleanup functionality
require('dotenv').config({ path: '.env.local' });

const { connectDB } = require('./lib/mongodb.js');

async function testCleanupSystem() {
  console.log('🧪 Testing cleanup system...');
  
  try {
    const { db } = await connectDB();
    
    // Check current state
    const processingCount = await db.collection('files').countDocuments({ status: 'processing' });
    const errorCount = await db.collection('files').countDocuments({ status: 'error' });
    const completedCount = await db.collection('files').countDocuments({ status: 'completed' });
    
    console.log('📊 Current file status distribution:');
    console.log(`   🔄 Processing: ${processingCount}`);
    console.log(`   ❌ Error: ${errorCount}`);
    console.log(`   ✅ Completed: ${completedCount}`);
    
    // Check for any files that might be stuck
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const potentiallyStuck = await db.collection('files').find({
      status: 'processing',
      updatedAt: { $lt: thirtyMinutesAgo }
    }).toArray();
    
    console.log(`\n🔍 Files potentially stuck (processing >30 min): ${potentiallyStuck.length}`);
    
    if (potentiallyStuck.length > 0) {
      console.log('⚠️ Found potentially stuck files:');
      potentiallyStuck.forEach((file, index) => {
        const hoursStuck = (new Date() - new Date(file.updatedAt)) / (1000 * 60 * 60);
        console.log(`   ${index + 1}. ${file._id} - stuck for ${hoursStuck.toFixed(1)} hours`);
      });
    }
    
    // Check for recent error files (from our fixes)
    const recentErrors = await db.collection('files').find({
      status: 'error',
      $or: [
        { autoErroredAt: { $exists: true } },
        { fixedAt: { $exists: true } },
        { error: { $regex: /timeout|stuck|expired/i } }
      ]
    }).sort({ updatedAt: -1 }).limit(5).toArray();
    
    console.log(`\n🔧 Recently fixed/errored files: ${recentErrors.length}`);
    recentErrors.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file._id} - ${file.error}`);
    });
    
    console.log('\n✅ Cleanup system test completed');
    console.log('💡 The automatic cleanup will run every 30 minutes via Vercel cron');
    console.log('🚀 Deploy to Vercel to activate automatic cleanup');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
if (require.main === module) {
  testCleanupSystem()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testCleanupSystem };
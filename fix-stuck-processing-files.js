// Fix Stuck Processing Files - Clean up all files stuck in processing status
const { connectDB } = require('./lib/mongodb.js');

async function fixStuckProcessingFiles() {
  console.log('🔧 Starting stuck processing files cleanup...');
  
  try {
    // Connect to database
    const { db } = await connectDB();
    console.log('📡 Connected to MongoDB');
    
    // Find all files stuck in processing status
    const stuckFiles = await db.collection('files')
      .find({ status: 'processing' })
      .toArray();
    
    console.log(`📊 Found ${stuckFiles.length} files stuck in processing status`);
    
    if (stuckFiles.length === 0) {
      console.log('✅ No stuck files found. All clean!');
      return;
    }
    
    // Show details of stuck files
    console.log('\n📋 Stuck files details:');
    stuckFiles.forEach((file, index) => {
      const createdDate = new Date(file.createdAt).toLocaleString();
      const userId = file.userId || 'Unknown';
      console.log(`${index + 1}. ${file.filename || file.name || 'Unknown'} (User: ${userId.substring(0, 8)}...) - Created: ${createdDate}`);
    });
    
    // Calculate how long files have been stuck
    const now = new Date();
    const recentStuck = [];
    const oldStuck = [];
    
    stuckFiles.forEach(file => {
      const createdAt = new Date(file.createdAt);
      const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);
      
      if (hoursSinceCreated > 2) { // More than 2 hours = definitely stuck
        oldStuck.push(file);
      } else {
        recentStuck.push(file);
      }
    });
    
    console.log(`\n⏰ Analysis:`);
    console.log(`   • ${oldStuck.length} files stuck for more than 2 hours (definitely stuck)`);
    console.log(`   • ${recentStuck.length} files stuck for less than 2 hours (might still be processing)`);
    
    // Update stuck files to error status
    if (oldStuck.length > 0) {
      console.log(`\n🔄 Updating ${oldStuck.length} definitely stuck files to error status...`);
      
      const updateResult = await db.collection('files').updateMany(
        { 
          status: 'processing',
          createdAt: { $lt: new Date(now - 2 * 60 * 60 * 1000) } // More than 2 hours old
        },
        { 
          $set: { 
            status: 'error',
            error: 'Processing timeout - file was stuck in processing status',
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`✅ Updated ${updateResult.modifiedCount} stuck files to error status`);
    }
    
    // Handle recent files (optional - ask user)
    if (recentStuck.length > 0) {
      console.log(`\n⚠️  ${recentStuck.length} files have been processing for less than 2 hours.`);
      console.log('   These might still be legitimately processing.');
      console.log('   You can manually review these if needed.');
      
      // List recent files for manual review
      recentStuck.forEach((file, index) => {
        const createdAt = new Date(file.createdAt);
        const minutesSinceCreated = Math.floor((now - createdAt) / (1000 * 60));
        console.log(`   ${index + 1}. ${file.filename || file.name} - Processing for ${minutesSinceCreated} minutes`);
      });
    }
    
    // Get final status
    const finalStuckCount = await db.collection('files').countDocuments({ status: 'processing' });
    console.log(`\n📊 Final status: ${finalStuckCount} files still in processing status`);
    
    // Summary stats by user
    const userStats = await db.collection('files').aggregate([
      { $match: { status: 'error', error: { $regex: 'Processing timeout' } } },
      { 
        $group: {
          _id: '$userId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    if (userStats.length > 0) {
      console.log('\n👥 Users affected by cleanup:');
      for (const stat of userStats) {
        console.log(`   User ${stat._id?.substring(0, 8)}...: ${stat.count} files cleaned up`);
      }
    }
    
    console.log('\n✅ Stuck processing files cleanup completed!');
    console.log('\n💡 Recommendations:');
    console.log('   • Users can retry uploading their files');
    console.log('   • Check transcription service health');
    console.log('   • Monitor for recurring stuck files');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
fixStuckProcessingFiles();
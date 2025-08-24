// Fix stuck processing videos - comprehensive solution
require('dotenv').config({ path: '.env.local' });

const { connectDB } = require('./lib/mongodb.js');
const { ObjectId } = require('mongodb');

async function fixStuckProcessing() {
  console.log('🔧 Starting comprehensive stuck processing fix...');
  
  try {
    const { db } = await connectDB();
    
    // Find all files stuck in processing status
    const stuckFiles = await db.collection('files').find({
      status: 'processing'
    }).toArray();
    
    console.log(`📊 Found ${stuckFiles.length} files stuck in processing status`);
    
    if (stuckFiles.length === 0) {
      console.log('✅ No stuck files found! All processing files are clean.');
      return;
    }
    
    let fixed = 0;
    let errors = 0;
    
    for (const file of stuckFiles) {
      try {
        console.log(`\n🔍 Analyzing file: ${file._id}`);
        console.log(`   📁 Name: ${file.filename}`);
        console.log(`   ⏰ Created: ${file.createdAt}`);
        console.log(`   🔄 Updated: ${file.updatedAt}`);
        console.log(`   👤 User: ${file.userId}`);
        
        // Calculate how long it's been stuck
        const now = new Date();
        const updatedAt = new Date(file.updatedAt);
        const hoursStuck = (now - updatedAt) / (1000 * 60 * 60);
        
        console.log(`   ⏳ Stuck for: ${hoursStuck.toFixed(1)} hours`);
        
        // Decision logic for how to fix
        let action = 'reset';
        let newStatus = 'pending';
        let reason = 'Reset to pending for reprocessing';
        
        // If stuck for more than 2 hours, mark as error
        if (hoursStuck > 2) {
          action = 'error';
          newStatus = 'error';
          reason = `Processing timeout after ${hoursStuck.toFixed(1)} hours`;
        }
        
        // If it has a transcriptId but is still processing, check if we can recover
        if (file.transcriptId && hoursStuck < 2) {
          action = 'recover';
          reason = 'Attempt to recover from external API';
        }
        
        console.log(`   🎯 Action: ${action} (${reason})`);
        
        // Perform the fix
        if (action === 'reset') {
          await db.collection('files').updateOne(
            { _id: file._id },
            {
              $set: {
                status: 'pending',
                updatedAt: new Date(),
                resetReason: 'Fixed stuck processing - reset to pending',
                resetAt: new Date()
              },
              $unset: {
                transcriptId: "",
                assemblyJobId: "",
                resultUrl: ""
              }
            }
          );
          console.log(`   ✅ Reset to pending status`);
          
        } else if (action === 'error') {
          await db.collection('files').updateOne(
            { _id: file._id },
            {
              $set: {
                status: 'error',
                error: reason,
                updatedAt: new Date(),
                fixedAt: new Date()
              }
            }
          );
          console.log(`   ❌ Marked as error: ${reason}`);
          
        } else if (action === 'recover') {
          // Try to recover by checking external API status
          console.log(`   🔄 Attempting recovery with transcriptId: ${file.transcriptId}`);
          
          try {
            // Try AssemblyAI first
            if (process.env.ASSEMBLYAI_API_KEY && file.transcriptId) {
              const response = await fetch(`https://api.assemblyai.com/v2/transcript/${file.transcriptId}`, {
                headers: { 'Authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY}` }
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log(`   📡 AssemblyAI status: ${data.status}`);
                
                if (data.status === 'completed') {
                  // File actually completed, update it
                  await db.collection('files').updateOne(
                    { _id: file._id },
                    {
                      $set: {
                        status: 'completed',
                        transcript: data.text || 'Transcript recovered',
                        updatedAt: new Date(),
                        recoveredAt: new Date(),
                        recoveryMethod: 'AssemblyAI status check'
                      }
                    }
                  );
                  console.log(`   ✅ Successfully recovered completed transcription!`);
                } else if (data.status === 'error') {
                  await db.collection('files').updateOne(
                    { _id: file._id },
                    {
                      $set: {
                        status: 'error',
                        error: `AssemblyAI error: ${data.error || 'Unknown error'}`,
                        updatedAt: new Date(),
                        recoveredAt: new Date()
                      }
                    }
                  );
                  console.log(`   ❌ Recovered error status from AssemblyAI`);
                } else {
                  // Still processing, reset to pending
                  await db.collection('files').updateOne(
                    { _id: file._id },
                    {
                      $set: {
                        status: 'pending',
                        updatedAt: new Date(),
                        resetReason: 'Still processing externally - reset for retry'
                      }
                    }
                  );
                  console.log(`   🔄 Still processing externally, reset to pending`);
                }
              } else {
                throw new Error(`AssemblyAI API error: ${response.status}`);
              }
            } else {
              // No way to check external status, reset to pending
              await db.collection('files').updateOne(
                { _id: file._id },
                {
                  $set: {
                    status: 'pending',
                    updatedAt: new Date(),
                    resetReason: 'Cannot verify external status - reset to pending'
                  }
                }
              );
              console.log(`   🔄 Cannot verify external status, reset to pending`);
            }
          } catch (recoveryError) {
            console.log(`   ⚠️ Recovery failed: ${recoveryError.message}`);
            // Fallback to reset
            await db.collection('files').updateOne(
              { _id: file._id },
              {
                $set: {
                  status: 'pending',
                  updatedAt: new Date(),
                  resetReason: 'Recovery failed - reset to pending',
                  recoveryError: recoveryError.message
                }
              }
            );
            console.log(`   🔄 Fallback: Reset to pending`);
          }
        }
        
        fixed++;
        
      } catch (error) {
        console.error(`   ❌ Error fixing file ${file._id}:`, error);
        errors++;
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   ✅ Files fixed: ${fixed}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📈 Success rate: ${((fixed / stuckFiles.length) * 100).toFixed(1)}%`);
    
    // Additional cleanup: Remove orphaned processing records
    console.log(`\n🧹 Performing additional cleanup...`);
    
    // Find files that have been "pending" for more than 1 hour (likely orphaned)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oldPendingFiles = await db.collection('files').find({
      status: 'pending',
      createdAt: { $lt: oneHourAgo },
      updatedAt: { $lt: oneHourAgo }
    }).toArray();
    
    console.log(`   🔍 Found ${oldPendingFiles.length} old pending files`);
    
    if (oldPendingFiles.length > 0) {
      for (const file of oldPendingFiles) {
        const hoursOld = (new Date() - new Date(file.createdAt)) / (1000 * 60 * 60);
        console.log(`   📁 ${file.filename} - ${hoursOld.toFixed(1)} hours old`);
        
        if (hoursOld > 24) {
          // Mark very old files as expired
          await db.collection('files').updateOne(
            { _id: file._id },
            {
              $set: {
                status: 'error',
                error: 'File expired - pending for more than 24 hours',
                updatedAt: new Date(),
                expiredAt: new Date()
              }
            }
          );
          console.log(`   ❌ Marked as expired (>24h old)`);
        }
      }
    }
    
    console.log(`\n🎉 Stuck processing fix completed!`);
    console.log(`   💡 Tip: Run this script regularly to prevent future stuck files`);
    console.log(`   🔗 Consider setting up automated cleanup with cron jobs`);
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  fixStuckProcessing()
    .then(() => {
      console.log('✅ Fix completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixStuckProcessing };

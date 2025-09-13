// API endpoint to clean up stuck processing files automatically
import { connectDB } from '../../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple auth check
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CLEANUP_SECRET || 'cleanup-secret-2024'}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🧹 Starting automatic cleanup of stuck processing files...');
    try {
    const dbConnection = await connectDB();
    if (!dbConnection || !dbConnection.db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const { db } = dbConnection;
    
    // Find files stuck in processing for more than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const stuckFiles = await db.collection('files').find({
      status: 'processing',
      updatedAt: { $lt: thirtyMinutesAgo }
    }).toArray();
    
    console.log(`Found ${stuckFiles.length} files stuck in processing`);
    
    let fixed = 0;
    let recovered = 0;
    let errored = 0;
    
    for (const file of stuckFiles) {
      try {
        const hoursStuck = (new Date() - new Date(file.updatedAt)) / (1000 * 60 * 60);
        console.log(`Processing file ${file._id} stuck for ${hoursStuck.toFixed(1)} hours`);
        
        // Try to recover if we have external IDs and it's been less than 2 hours
        if ((file.transcriptId || file.assemblyJobId) && hoursStuck < 2) {
          try {
            let recovered_status = false;
            
            // Try AssemblyAI recovery
            if (process.env.ASSEMBLYAI_API_KEY && (file.transcriptId || file.assemblyJobId)) {
              const transcriptId = file.transcriptId || file.assemblyJobId;
              const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: { 'Authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY}` }
              });
              
              if (response.ok) {
                const data = await response.json();
                
                if (data.status === 'completed') {
                  await db.collection('files').updateOne(
                    { _id: file._id },
                    {
                      $set: {
                        status: 'completed',
                        transcript: data.text || 'Transcript recovered',
                        updatedAt: new Date(),
                        autoRecoveredAt: new Date(),
                        recoveryMethod: 'AssemblyAI'
                      }
                    }
                  );
                  console.log(`✅ Recovered completed file: ${file._id}`);
                  recovered++;
                  recovered_status = true;
                } else if (data.status === 'error') {
                  await db.collection('files').updateOne(
                    { _id: file._id },
                    {
                      $set: {
                        status: 'error',
                        error: `External error: ${data.error || 'Processing failed'}`,
                        updatedAt: new Date(),
                        autoRecoveredAt: new Date()
                      }
                    }
                  );
                  console.log(`❌ Recovered error status: ${file._id}`);
                  errored++;
                  recovered_status = true;
                }
              }
            }
            
            // If not recovered, reset to pending for retry
            if (!recovered_status) {
              await db.collection('files').updateOne(
                { _id: file._id },
                {
                  $set: {
                    status: 'pending',
                    updatedAt: new Date(),
                    autoResetAt: new Date(),
                    resetReason: 'Auto-cleanup - stuck processing reset to retry'
                  },
                  $unset: {
                    transcriptId: "",
                    assemblyJobId: "",
                    resultUrl: ""
                  }
                }
              );
              console.log(`🔄 Reset to pending: ${file._id}`);
              fixed++;
            }
            
          } catch (recoveryError) {
            // Recovery failed, reset to pending
            await db.collection('files').updateOne(
              { _id: file._id },
              {
                $set: {
                  status: 'pending',
                  updatedAt: new Date(),
                  autoResetAt: new Date(),
                  resetReason: 'Auto-cleanup - recovery failed, reset for retry'
                }
              }
            );
            console.log(`🔄 Recovery failed, reset to pending: ${file._id}`);
            fixed++;
          }
        } else {
          // Too old or no external ID, mark as error
          await db.collection('files').updateOne(
            { _id: file._id },
            {
              $set: {
                status: 'error',
                error: `Processing timeout after ${hoursStuck.toFixed(1)} hours`,
                updatedAt: new Date(),
                autoErroredAt: new Date()
              }
            }
          );
          console.log(`❌ Marked as error (timeout): ${file._id}`);
          errored++;
        }
        
      } catch (error) {
        console.error(`Error processing file ${file._id}:`, error);
      }
    }
    
    // Additional cleanup: Handle old pending files
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const oldPending = await db.collection('files').find({
      status: 'pending',
      createdAt: { $lt: twoHoursAgo },
      updatedAt: { $lt: twoHoursAgo }
    }).toArray();
    
    let expiredCount = 0;
    for (const file of oldPending) {
      const hoursOld = (new Date() - new Date(file.createdAt)) / (1000 * 60 * 60);
      if (hoursOld > 24) {
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
        expiredCount++;
      }
    }
    
    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalProcessed: stuckFiles.length,
        recovered: recovered,
        reset: fixed,
        errored: errored,
        expired: expiredCount
      },
      message: `Processed ${stuckFiles.length} stuck files: ${recovered} recovered, ${fixed} reset, ${errored} errored, ${expiredCount} expired`
    };
    
    console.log('🎉 Cleanup completed:', results.message);
    res.status(200).json(results);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    res.status(500).json({ 
      error: 'Cleanup failed',
      details: error.message 
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  maxDuration: 30, // 30 seconds max for cleanup
};
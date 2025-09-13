// Send maintenance notification email to all users
console.log('📧 Preparing maintenance notification email to all users...');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_LOGIN,
    pass: process.env.SMTP_PASSWORD,
  },
});

// MongoDB connection
const mongoUri = process.env.MONGODB_URI;

async function sendMaintenanceNotification() {
  const client = new MongoClient(mongoUri);
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    const db = client.db();
    
    // Get all users with valid email addresses
    console.log('👥 Fetching all users...');
    const users = await db.collection('users').find({
      email: { $exists: true, $ne: '' }
    }).toArray();
    
    console.log(`📊 Found ${users.length} users to notify`);
    
    if (users.length === 0) {
      console.log('❌ No users found with valid email addresses');
      return;
    }

    // Create the maintenance notification email
    const emailSubject = '🔧 Ecouter System Enhancement - Service Restored & Improved!';
    
    const createEmailContent = (userName) => {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🚀 Ecouter System Update</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your transcription service is back and better than ever!</p>
          </div>

          <!-- Main Content -->
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Hello ${userName || 'Valued User'},</p>
            
            <p>We're excited to inform you that our maintenance work has been <strong>completed successfully</strong> and your Ecouter transcription service is now fully operational with significant improvements!</p>

            <!-- Enhancement Highlights -->
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #0c4a6e; margin-top: 0; display: flex; align-items: center;">
                ✨ What's New & Improved
              </h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>🎯 Enhanced Accuracy:</strong> Upgraded to latest Whisper models for better transcription quality</li>
                <li><strong>⚡ Faster Processing:</strong> Optimized infrastructure for quicker transcription turnaround</li>
                <li><strong>🔒 Improved Reliability:</strong> Multi-tier backup system ensures 99.9% uptime</li>
                <li><strong>🌐 Better Language Support:</strong> Enhanced support for multiple languages and accents</li>
                <li><strong>💾 Smart API Management:</strong> Intelligent routing for optimal performance</li>
              </ul>
            </div>

            <!-- Status Update -->
            <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #15803d; margin-top: 0;">🟢 Current System Status</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="margin: 5px 0;"><strong>Service Status:</strong> ✅ Fully Operational</p>
                  <p style="margin: 5px 0;"><strong>API Health:</strong> ✅ All Systems Green</p>
                  <p style="margin: 5px 0;"><strong>Upload Processing:</strong> ✅ Real-time</p>
                </div>
                <div>
                  <p style="margin: 5px 0;"><strong>Transcription Speed:</strong> ✅ Optimized</p>
                  <p style="margin: 5px 0;"><strong>File Support:</strong> ✅ All Formats</p>
                  <p style="margin: 5px 0;"><strong>Account Access:</strong> ✅ Available</p>
                </div>
              </div>
            </div>

            <!-- Support Information -->
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #92400e; margin-top: 0;">📞 Need Help?</h3>
              <p style="margin: 0;">If you experience any issues or have questions about the new features, please don't hesitate to reach out:</p>
              <p style="margin: 10px 0 0 0;">
                <strong>📧 Support Email:</strong> 
                <a href="mailto:ecouter.transcribe@gmail.com" style="color: #1d4ed8; text-decoration: none;">
                  ecouter.transcribe@gmail.com
                </a>
              </p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #92400e;">
                <em>Note: Our main support system is temporarily offline, but we're personally monitoring this email for quick responses.</em>
              </p>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://ecouter.systems" 
                 style="background: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                🚀 Start Transcribing Now
              </a>
            </div>

            <p>Thank you for your patience during the maintenance period. We're confident you'll love the enhanced performance and new capabilities!</p>

            <p>Best regards,<br>
            <strong>The Ecouter Team</strong></p>
          </div>

          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              🌐 <a href="https://ecouter.systems" style="color: #4f46e5;">ecouter.systems</a> | 
              📧 <a href="mailto:ecouter.transcribe@gmail.com" style="color: #4f46e5;">ecouter.transcribe@gmail.com</a>
            </p>
            <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
              This email was sent to notify you about important service updates. 
            </p>
          </div>
        </div>
      `;
    };

    // Send emails in batches to avoid overwhelming the SMTP server
    console.log('📤 Starting email notifications...');
    const batchSize = 10; // Send 10 emails at a time
    let sentCount = 0;
    let failedCount = 0;
    const failedEmails = [];

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      console.log(`📫 Sending batch ${Math.ceil((i + 1) / batchSize)} of ${Math.ceil(users.length / batchSize)} (${batch.length} emails)...`);
      
      // Send emails in this batch
      const batchPromises = batch.map(async (user) => {
        try {
          const mailOptions = {
            from: process.env.SMTP_SENDER,
            to: user.email,
            subject: emailSubject,
            html: createEmailContent(user.name),
          };

          await transporter.sendMail(mailOptions);
          console.log(`✅ Sent to: ${user.email}`);
          sentCount++;
        } catch (error) {
          console.error(`❌ Failed to send to ${user.email}:`, error.message);
          failedCount++;
          failedEmails.push({ email: user.email, error: error.message });
        }
      });

      // Wait for this batch to complete
      await Promise.all(batchPromises);
      
      // Wait 2 seconds between batches to avoid rate limiting
      if (i + batchSize < users.length) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Final summary
    console.log('\n🎉 EMAIL NOTIFICATION COMPLETE!');
    console.log('=====================================');
    console.log(`📊 Total Users: ${users.length}`);
    console.log(`✅ Successfully Sent: ${sentCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    
    if (failedEmails.length > 0) {
      console.log('\n❌ Failed Email Details:');
      failedEmails.forEach(({ email, error }, index) => {
        console.log(`  ${index + 1}. ${email} - ${error}`);
      });
    }

    // Send summary email to admin
    if (sentCount > 0) {
      console.log('\n📧 Sending admin summary...');
      try {
        const adminSummary = {
          from: process.env.SMTP_SENDER,
          to: 'ecouter.transcribe@gmail.com',
          subject: '📊 Maintenance Notification Summary - Email Campaign Complete',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">📊 Maintenance Notification Campaign Complete</h2>
              <p><strong>Campaign Date:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Total Users in Database:</strong> ${users.length}</p>
              <p><strong>✅ Successfully Sent:</strong> ${sentCount}</p>
              <p><strong>❌ Failed:</strong> ${failedCount}</p>
              
              ${failedEmails.length > 0 ? `
                <h3 style="color: #dc2626;">Failed Emails:</h3>
                <ul>
                  ${failedEmails.map(({ email, error }) => `<li>${email} - ${error}</li>`).join('')}
                </ul>
              ` : ''}
              
              <p style="margin-top: 30px;"><em>All users have been notified about the maintenance completion and system enhancements.</em></p>
            </div>
          `,
        };

        await transporter.sendMail(adminSummary);
        console.log('✅ Admin summary sent successfully!');
      } catch (error) {
        console.error('❌ Failed to send admin summary:', error.message);
      }
    }

  } catch (error) {
    console.error('💥 Error during notification process:', error);
  } finally {
    await client.close();
    console.log('🔐 Database connection closed');
  }
}

// Run the notification
sendMaintenanceNotification().then(() => {
  console.log('\n🏁 Maintenance notification process completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Notification process failed:', error);
  process.exit(1);
});
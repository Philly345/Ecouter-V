// Gmail Troubleshooting Guide for Missing Emails
console.log('📧 Gmail Email Troubleshooting Guide');
console.log('=====================================');
console.log('');

console.log('🔍 WHERE TO CHECK FOR MISSING EMAILS:');
console.log('');

console.log('1. 📁 SPAM/JUNK FOLDER:');
console.log('   - Go to Gmail → Left sidebar → More → Spam');
console.log('   - Look for emails from: no-reply@ecouter.systems');
console.log('   - If found, click "Not spam" button');
console.log('');

console.log('2. 📂 PROMOTIONS TAB:');
console.log('   - Look at the top of Gmail inbox for tabs');
console.log('   - Click "Promotions" tab');
console.log('   - Search for "Ecouter" or "Password Reset"');
console.log('');

console.log('3. 🔍 SEARCH GMAIL:');
console.log('   - Use Gmail search bar');
console.log('   - Search terms to try:');
console.log('     • "Ecouter"');
console.log('     • "Password Reset"');
console.log('     • "no-reply@ecouter.systems"');
console.log('     • "91659a001@smtp-brevo.com"');
console.log('     • Subject: "Password Reset"');
console.log('');

console.log('4. 📨 ALL MAIL FOLDER:');
console.log('   - Go to Gmail → Left sidebar → More → All Mail');
console.log('   - Search for "Ecouter" in All Mail');
console.log('');

console.log('5. 🚫 CHECK GMAIL FILTERS:');
console.log('   - Go to Gmail Settings (gear icon) → See all settings');
console.log('   - Click "Filters and Blocked Addresses" tab');
console.log('   - Look for filters that might block ecouter.systems emails');
console.log('   - Delete any problematic filters');
console.log('');

console.log('🔧 GMAIL SETTINGS TO CHECK:');
console.log('');

console.log('1. 📬 INBOX TYPE:');
console.log('   - Gmail Settings → Inbox tab');
console.log('   - Make sure inbox type allows all emails');
console.log('');

console.log('2. 🛡️ BLOCKED ADDRESSES:');
console.log('   - Gmail Settings → Filters and Blocked Addresses');
console.log('   - Check if no-reply@ecouter.systems is blocked');
console.log('   - Check if ecouter.systems domain is blocked');
console.log('');

console.log('3. 📧 FORWARDING:');
console.log('   - Gmail Settings → Forwarding and POP/IMAP');
console.log('   - Check if emails are being forwarded elsewhere');
console.log('');

console.log('🚨 IMMEDIATE ACTIONS:');
console.log('');

console.log('1. 🔍 Search your Gmail right now for:');
console.log('   "no-reply@ecouter.systems" (including quotes)');
console.log('');

console.log('2. 📱 Check Gmail on mobile:');
console.log('   - Sometimes mobile shows emails that desktop misses');
console.log('');

console.log('3. 🔄 Try different email:');
console.log('   - Test with ecouter.transcribe@gmail.com');
console.log('   - Test with a different Gmail account');
console.log('');

console.log('4. ⏰ Check delivery timing:');
console.log('   - Emails can take 1-5 minutes to arrive');
console.log('   - Brevo sometimes has delays');
console.log('');

console.log('🛠️ TECHNICAL DEBUGGING:');
console.log('');

console.log('1. 📊 Check Brevo Dashboard:');
console.log('   - Login to your Brevo account');
console.log('   - Go to Statistics → Email');
console.log('   - Check if emails are being delivered');
console.log('');

console.log('2. 📧 Email Headers:');
console.log('   - If you find the email, check full headers');
console.log('   - Look for delivery path and any issues');
console.log('');

console.log('3. 🔗 Alternative Email Provider:');
console.log('   - Try sending to a different email service');
console.log('   - Test with Outlook, Yahoo, etc.');
console.log('');

console.log('💡 NEXT STEPS:');
console.log('1. Search Gmail thoroughly using the methods above');
console.log('2. Run the test again: node test-email-delivery.js');
console.log('3. Check both phillyrick34@gmail.com and ecouter.transcribe@gmail.com');
console.log('4. If still no emails, we may need to switch SMTP providers');
console.log('');

console.log('🆘 IF EMAILS ARE STILL MISSING:');
console.log('- The SMTP is working (we got success responses)');
console.log('- Emails are being sent from Brevo');
console.log('- Gmail might be silently filtering them');
console.log('- We can switch to Gmail SMTP or another provider');
console.log('');

console.log('📞 Need immediate help?');
console.log('Let me know what you find in your Gmail search!');
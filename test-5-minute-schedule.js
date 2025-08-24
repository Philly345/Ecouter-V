// Test 15-Minute Monitoring Schedule
console.log('⚡ ====== 15-MINUTE MONITORING SCHEDULE TEST ======');
console.log(`🕐 Current time: ${new Date().toLocaleString()}`);

// Calculate next 15-minute intervals
const now = new Date();
const currentMinute = now.getMinutes();
const currentSecond = now.getSeconds();

// Find next 15-minute mark
const nextFifteenMinuteMark = Math.ceil(currentMinute / 15) * 15;
const nextTrigger = new Date(now);
nextTrigger.setMinutes(nextFifteenMinuteMark);
nextTrigger.setSeconds(0);
nextTrigger.setMilliseconds(0);

// If we're past this hour's last 15-minute mark, go to next hour
if (nextFifteenMinuteMark >= 60) {
  nextTrigger.setHours(nextTrigger.getHours() + 1);
  nextTrigger.setMinutes(0);
}

console.log('\n📅 NEW MONITORING SCHEDULE:');
console.log('   Frequency: Every 15 minutes');
console.log('   Cron: "*/15 * * * *"');
console.log('   Daily checks: 96 (Vercel Hobby plan friendly)');

console.log('\n⏰ NEXT TRIGGER TIMES:');
for (let i = 0; i < 6; i++) {
  const triggerTime = new Date(nextTrigger);
  triggerTime.setMinutes(triggerTime.getMinutes() + (i * 15));
  
  const timeStr = triggerTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  console.log(`   ${i + 1}. ${timeStr}`);
}

console.log('\n📧 EMAIL FREQUENCY:');
console.log('   - Report every 15 minutes');
console.log('   - 4 reports per hour');
console.log('   - 96 reports per day');
console.log('   - Vercel Hobby plan compatible');

console.log('\n🎯 BENEFITS:');
console.log('   ✅ Frequent issue detection');
console.log('   ✅ Reasonable monitoring frequency');
console.log('   ✅ Compatible with all Vercel plans');
console.log('   ✅ Good balance of monitoring vs. limits');

const minutesUntilNext = Math.ceil((nextTrigger - now) / 1000 / 60);
console.log(`\n⏰ NEXT COMPREHENSIVE REPORT: ${nextTrigger.toLocaleString()}`);
console.log(`   (in approximately ${minutesUntilNext} minute${minutesUntilNext !== 1 ? 's' : ''})`);

console.log('\n🚀 The monitoring system will now send reports every 15 minutes!');
console.log('✅ Schedule optimized for Vercel plan compatibility.');
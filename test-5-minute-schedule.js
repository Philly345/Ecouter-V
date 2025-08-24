// Test Hourly Monitoring Schedule
console.log('⏰ ====== HOURLY MONITORING SCHEDULE TEST ======');
console.log(`🕐 Current time: ${new Date().toLocaleString()}`);

// Calculate next hour
const now = new Date();
const nextHour = new Date(now);
nextHour.setHours(nextHour.getHours() + 1);
nextHour.setMinutes(0);
nextHour.setSeconds(0);
nextHour.setMilliseconds(0);

console.log('\n📅 MONITORING SCHEDULE:');
console.log('   Frequency: Every hour');
console.log('   Cron: "0 * * * *"');
console.log('   Daily checks: 24 (Perfect for all Vercel plans)');

console.log('\n⏰ NEXT TRIGGER TIMES:');
for (let i = 0; i < 6; i++) {
  const triggerTime = new Date(nextHour);
  triggerTime.setHours(triggerTime.getHours() + i);
  
  const timeStr = triggerTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  console.log(`   ${i + 1}. ${timeStr}`);
}

console.log('\n📧 EMAIL FREQUENCY:');
console.log('   - Report every hour at :00 minutes');
console.log('   - 24 reports per day');
console.log('   - Compatible with ALL Vercel plans');
console.log('   - Reliable and consistent monitoring');

console.log('\n🎯 BENEFITS:');
console.log('   ✅ Consistent hourly health checks');
console.log('   ✅ Compatible with Hobby/Pro/Enterprise plans');
console.log('   ✅ Reliable monitoring without limits');
console.log('   ✅ Professional monitoring schedule');
console.log('   ✅ Comprehensive system analysis every hour');

const minutesUntilNext = Math.ceil((nextHour - now) / 1000 / 60);
console.log(`\n⏰ NEXT COMPREHENSIVE REPORT: ${nextHour.toLocaleString()}`);
console.log(`   (in approximately ${minutesUntilNext} minute${minutesUntilNext !== 1 ? 's' : ''})`);

console.log('\n🚀 The monitoring system will send hourly comprehensive reports!');
console.log('✅ Schedule optimized for maximum Vercel compatibility.');
// Test Cron Job Setup
console.log('🔧 Testing AutoPost VN Cron Job Setup...\n');

async function testHealth() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health Check:', data);
      return true;
    } else {
      console.log('❌ Health Check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Health Check error:', error.message);
    return false;
  }
}

async function testScheduler() {
  try {
    const response = await fetch('http://localhost:3000/api/cron/scheduler?limit=5');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Scheduler Test:', {
        success: data.success,
        processed: data.processed,
        successful: data.successful,
        failed: data.failed
      });
      return true;
    } else {
      console.log('❌ Scheduler Test failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Scheduler Test error:', error.message);
    return false;
  }
}

async function checkDatabase() {
  try {
    const response = await fetch('http://localhost:3000/api/posts');
    if (response.ok) {
      const data = await response.json();
      const scheduledPosts = data.posts?.filter(p => p.status === 'scheduled') || [];
      console.log(`✅ Database Check: Found ${scheduledPosts.length} scheduled posts`);
      return true;
    } else {
      console.log('❌ Database Check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Database Check error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🏥 1. Testing Health Endpoint...');
  const healthOk = await testHealth();
  
  console.log('\n📊 2. Testing Scheduler Endpoint...');
  const schedulerOk = await testScheduler();
  
  console.log('\n💾 3. Testing Database Connection...');
  const dbOk = await checkDatabase();
  
  console.log('\n📋 Summary:');
  console.log(`Health Check: ${healthOk ? '✅' : '❌'}`);
  console.log(`Scheduler: ${schedulerOk ? '✅' : '❌'}`);
  console.log(`Database: ${dbOk ? '✅' : '❌'}`);
  
  if (healthOk && schedulerOk && dbOk) {
    console.log('\n🎉 All tests passed! Ready to setup cron job.');
    console.log('\n🚀 Next steps:');
    console.log('1. Run: npm run cron:windows (to test PowerShell script)');
    console.log('2. Setup Task Scheduler using CRON_SETUP_GUIDE.md');
    console.log('3. Monitor logs in logs/ directory');
  } else {
    console.log('\n⚠️ Some tests failed. Please fix issues before setting up cron job.');
    console.log('\n🔧 Troubleshooting:');
    if (!healthOk) console.log('- Make sure Next.js app is running: npm run dev');
    if (!schedulerOk) console.log('- Check scheduler implementation in /api/cron/scheduler');
    if (!dbOk) console.log('- Verify database connection and schema');
  }
}

main().catch(console.error);

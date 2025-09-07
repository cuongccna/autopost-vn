// Final Cron Setup Verification
console.log('🎯 AutoPost VN Cron Job - Final Setup Verification\n');

async function runFinalChecks() {
  const checks = [];
  
  // 1. Health Check
  try {
    const health = await fetch('http://localhost:3000/api/health');
    const healthData = await health.json();
    checks.push({
      name: 'Health Check',
      status: health.ok ? 'PASS' : 'FAIL',
      details: healthData.status
    });
  } catch (error) {
    checks.push({
      name: 'Health Check',
      status: 'FAIL',
      details: 'App not running'
    });
  }

  // 2. Scheduler API
  try {
    const scheduler = await fetch('http://localhost:3000/api/cron/scheduler?limit=1');
    const schedulerData = await scheduler.json();
    checks.push({
      name: 'Scheduler API',
      status: scheduler.ok && schedulerData.success ? 'PASS' : 'FAIL',
      details: `Processed: ${schedulerData.processed || 0}`
    });
  } catch (error) {
    checks.push({
      name: 'Scheduler API',
      status: 'FAIL',
      details: 'API error'
    });
  }

  // 3. File System Checks
  const fs = require('fs');
  const path = require('path');
  
  // Check scripts exist
  const scriptsExist = [
    'scripts/autopost-cron-simple.ps1',
    'scripts/autopost-cron.ps1',
    'scripts/cron-local.ts'
  ].every(file => fs.existsSync(file));
  
  checks.push({
    name: 'Cron Scripts',
    status: scriptsExist ? 'PASS' : 'FAIL',
    details: scriptsExist ? 'All scripts found' : 'Missing scripts'
  });

  // Check logs directory
  const logsExist = fs.existsSync('logs');
  checks.push({
    name: 'Logs Directory',
    status: logsExist ? 'PASS' : 'FAIL',
    details: logsExist ? 'Directory exists' : 'Need to create'
  });

  // 4. Package.json scripts
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['cron', 'cron:windows', 'health'];
  const scriptsOk = requiredScripts.every(script => packageJson.scripts[script]);
  
  checks.push({
    name: 'NPM Scripts',
    status: scriptsOk ? 'PASS' : 'FAIL',
    details: scriptsOk ? 'All scripts configured' : 'Missing scripts'
  });

  // Display results
  console.log('📋 Setup Verification Results:');
  console.log('================================');
  
  let allPassed = true;
  checks.forEach(check => {
    const icon = check.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${check.name}: ${check.status} - ${check.details}`);
    if (check.status === 'FAIL') allPassed = false;
  });

  console.log('\n🎯 Overall Status:', allPassed ? '✅ READY' : '❌ NEEDS ATTENTION');
  
  if (allPassed) {
    console.log('\n🚀 Next Steps:');
    console.log('1. Open Task Scheduler (taskschd.msc)');
    console.log('2. Create Basic Task: "AutoPost VN Scheduler"');
    console.log('3. Set trigger: Every 5 minutes');
    console.log('4. Set action: powershell.exe -ExecutionPolicy Bypass -File "scripts\\autopost-cron-simple.ps1"');
    console.log('5. Test the task by right-clicking → Run');
    console.log('6. Monitor logs in logs/ directory');
    console.log('\n✨ Your AutoPost VN will automatically post to Facebook!');
  } else {
    console.log('\n🔧 Fix Issues:');
    checks.filter(c => c.status === 'FAIL').forEach(check => {
      console.log(`- ${check.name}: ${check.details}`);
    });
  }
}

runFinalChecks().catch(console.error);

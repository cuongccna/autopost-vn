async function testScheduler() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('http://localhost:3000/api/cron/scheduler?limit=10');
    const data = await response.json();
    
    console.log('Scheduler result:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testScheduler();

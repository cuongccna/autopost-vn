const fetch = require('node-fetch');

async function testRateLimitAPI() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    // First get session to get cookies
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const cookies = sessionResponse.headers.get('set-cookie');
    
    console.log('Session cookies:', cookies);
    
    // Test the rate limit endpoint
    const response = await fetch('http://localhost:3000/api/posts/check-rate-limit', {
      headers: {
        'Cookie': cookies || ''
      }
    });
    
    const data = await response.json();
    console.log('Rate limit API response:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testRateLimitAPI();

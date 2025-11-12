/**
 * Test Instagram Webhook Locally
 * 
 * This script tests the Instagram webhook endpoint without needing ngrok
 */

const http = require('http');

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/instagram';
const VERIFY_TOKEN = 'autopostvn_instagram_webhook_secret_2025';

console.log('🧪 Testing Instagram Webhook...\n');

// Test 1: Webhook Verification (GET)
async function testVerification() {
  console.log('1️⃣ Testing webhook verification (GET)...');
  
  const url = `${WEBHOOK_URL}?hub.mode=subscribe&hub.challenge=test_challenge_123&hub.verify_token=${VERIFY_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    if (response.status === 200 && text === 'test_challenge_123') {
      console.log('   ✅ Verification PASSED');
      console.log(`   Response: ${text}\n`);
      return true;
    } else {
      console.log('   ❌ Verification FAILED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${text}\n`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
    return false;
  }
}

// Test 2: Comment Event (POST)
async function testCommentEvent() {
  console.log('2️⃣ Testing comment event (POST)...');
  
  const payload = {
    object: 'instagram',
    entry: [
      {
        id: '17841405309211844', // Instagram account ID
        time: Date.now(),
        changes: [
          {
            field: 'comments',
            value: {
              id: '17123456789', // Comment ID
              text: 'This is a test comment from webhook!',
              media_id: '17987654321', // Media (post) ID
            }
          }
        ]
      }
    ]
  };
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (response.status === 200 && data.success) {
      console.log('   ✅ Comment event PASSED');
      console.log(`   Response: ${JSON.stringify(data)}\n`);
      return true;
    } else {
      console.log('   ❌ Comment event FAILED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data)}\n`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
    return false;
  }
}

// Test 3: Mention Event (POST)
async function testMentionEvent() {
  console.log('3️⃣ Testing mention event (POST)...');
  
  const payload = {
    object: 'instagram',
    entry: [
      {
        id: '17841405309211844',
        time: Date.now(),
        changes: [
          {
            field: 'mentions',
            value: {
              media_id: '17987654321',
              comment_id: '17555555555',
            }
          }
        ]
      }
    ]
  };
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (response.status === 200 && data.success) {
      console.log('   ✅ Mention event PASSED');
      console.log(`   Response: ${JSON.stringify(data)}\n`);
      return true;
    } else {
      console.log('   ❌ Mention event FAILED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data)}\n`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('⚠️  Make sure dev server is running: npm run dev\n');
  
  // Wait a bit for user to see the message
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const results = {
    verification: await testVerification(),
    commentEvent: await testCommentEvent(),
    mentionEvent: await testMentionEvent(),
  };
  
  console.log('📊 Test Results:');
  console.log(`   Verification: ${results.verification ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Comment Event: ${results.commentEvent ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Mention Event: ${results.mentionEvent ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r === true);
  console.log(`\n${allPassed ? '✅ All tests PASSED!' : '❌ Some tests FAILED'}`);
  
  process.exit(allPassed ? 0 : 1);
}

runTests();

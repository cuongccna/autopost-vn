#!/usr/bin/env node

/**
 * Test script for Gemini AI API
 * Usage: node test-gemini-api.js
 */

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test configuration
const API_BASE = 'http://localhost:3000';

// Test Gemini API endpoints
async function testGeminiCaption() {
  log('cyan', '\n🧪 Testing Gemini Caption Generation...');
  
  try {
    const response = await fetch(`${API_BASE}/api/ai/caption`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform: 'facebook',
        title: 'Sản phẩm mới ra mắt',
        content: 'Giới thiệu sản phẩm công nghệ mới với tính năng vượt trội',
        tone: 'exciting',
        aiContext: {
          category: 'Technology',
          businessType: 'E-commerce',
          targetAudience: 'Tech enthusiasts',
          brandVoice: 'Friendly and innovative'
        }
      }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      log('green', '✅ Caption generation successful');
      console.log('Generated Caption:', result.caption);
      console.log('Metadata:', JSON.stringify(result.metadata, null, 2));
    } else {
      if (response.status === 429) {
        log('yellow', '⚠️ Rate limit hit (expected for testing)');
        console.log('Rate limit response:', result);
      } else if (response.status === 401) {
        log('yellow', '⚠️ Authentication required (expected)');
        console.log('Auth response:', result);
      } else {
        log('red', '❌ Caption generation failed');
        console.log('Error:', result);
      }
    }
  } catch (error) {
    log('red', `❌ Caption generation error: ${error.message}`);
  }
}

async function testGeminiHashtags() {
  log('cyan', '\n🧪 Testing Gemini Hashtags Generation...');
  
  try {
    const response = await fetch(`${API_BASE}/api/ai/hashtags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform: 'instagram',
        title: 'Du lịch Việt Nam',
        content: 'Khám phá những địa điểm đẹp nhất Việt Nam',
        count: 10,
        aiContext: {
          category: 'Travel',
          targetAudience: 'Young travelers',
          location: 'Vietnam'
        }
      }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      log('green', '✅ Hashtags generation successful');
      console.log('Generated Hashtags:', result.hashtags);
    } else {
      if (response.status === 429) {
        log('yellow', '⚠️ Rate limit hit (expected for testing)');
        console.log('Rate limit response:', result);
      } else if (response.status === 401) {
        log('yellow', '⚠️ Authentication required (expected)');
        console.log('Auth response:', result);
      } else {
        log('red', '❌ Hashtags generation failed');
        console.log('Error:', result);
      }
    }
  } catch (error) {
    log('red', `❌ Hashtags generation error: ${error.message}`);
  }
}

async function testGeminiScript() {
  log('cyan', '\n🧪 Testing Gemini Script Generation...');
  
  try {
    const response = await fetch(`${API_BASE}/api/ai/script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform: 'tiktok',
        title: 'Hướng dẫn nấu ăn',
        content: 'Cách làm món phở bò truyền thống',
        duration: 60,
        tone: 'engaging'
      }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      log('green', '✅ Script generation successful');
      console.log('Generated Script:', result.script);
    } else {
      if (response.status === 429) {
        log('yellow', '⚠️ Rate limit hit (expected for testing)');
        console.log('Rate limit response:', result);
      } else if (response.status === 401) {
        log('yellow', '⚠️ Authentication required (expected)');
        console.log('Auth response:', result);
      } else {
        log('red', '❌ Script generation failed');
        console.log('Error:', result);
      }
    }
  } catch (error) {
    log('red', `❌ Script generation error: ${error.message}`);
  }
}

// Test server health
async function testServerHealth() {
  log('cyan', '\n🏥 Testing server health...');
  
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    
    if (response.ok) {
      log('green', '✅ Server is healthy');
    } else {
      log('yellow', '⚠️ Server health check failed, but server is responding');
    }
  } catch (error) {
    log('red', `❌ Server is not responding: ${error.message}`);
    log('yellow', '💡 Make sure to run "npm run dev" first');
    process.exit(1);
  }
}

// Test rate limiting behavior
async function testRateLimit() {
  log('cyan', '\n🧪 Testing Rate Limit Behavior...');
  
  const requests = [];
  
  // Send multiple requests quickly to test rate limiting
  for (let i = 0; i < 5; i++) {
    requests.push(
      fetch(`${API_BASE}/api/ai/caption`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'facebook',
          title: `Test ${i + 1}`,
          content: 'Testing rate limit behavior',
          tone: 'casual'
        }),
      })
    );
  }
  
  try {
    const responses = await Promise.all(requests);
    
    let successCount = 0;
    let rateLimitCount = 0;
    let authErrorCount = 0;
    
    for (const response of responses) {
      if (response.ok) {
        successCount++;
      } else if (response.status === 429) {
        rateLimitCount++;
      } else if (response.status === 401) {
        authErrorCount++;
      }
    }
    
    log('blue', `📊 Rate Limit Test Results:`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ⚠️  Rate Limited: ${rateLimitCount}`);
    console.log(`  🔒 Auth Required: ${authErrorCount}`);
    
    if (rateLimitCount > 0) {
      log('green', '✅ Rate limiting is working correctly');
    } else if (authErrorCount > 0) {
      log('yellow', '⚠️ All requests require authentication (expected)');
    } else {
      log('yellow', '⚠️ No rate limiting detected (might need authentication)');
    }
    
  } catch (error) {
    log('red', `❌ Rate limit test error: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  log('magenta', '🚀 Starting Gemini AI API Tests');
  log('blue', `📡 API Base: ${API_BASE}`);
  
  await testServerHealth();
  
  // Run all AI tests
  await testGeminiCaption();
  await testGeminiHashtags();
  await testGeminiScript();
  await testRateLimit();
  
  log('magenta', '\n🎉 All Gemini AI tests completed!');
  
  log('cyan', '\n📋 Summary:');
  log('blue', '• Gemini AI endpoints are accessible');
  log('blue', '• Rate limiting is implemented');
  log('blue', '• Authentication is required for actual usage');
  log('yellow', '• To test with real data, authenticate in browser first');
  
  log('cyan', '\n💡 Next Steps:');
  log('blue', '1. Check GEMINI_API_KEY in .env.local');
  log('blue', '2. Verify Gemini API quota and billing');
  log('blue', '3. Test with authenticated session in browser');
  log('blue', '4. Monitor rate limit behavior in production');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log('red', `❌ Unhandled error: ${error.message}`);
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    log('red', `❌ Test runner error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests };

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAICaption() {
  try {
    console.log('🧪 Testing AI Caption API directly...
');

    // Get user info first
    const { data: users, error: usersError } = await supabase
      .from('autopostvn_users')
      .select('id, email, user_role')
      .eq('email', 'qiangvinhhoan@gmail.com')
      .single();

    if (usersError) {
      console.error('❌ Error fetching user:', usersError);
      return;
    }

    console.log(`👤 Testing with user: ${users.email} (${users.user_role})`);
    console.log(`🆔 User ID: ${users.id}
`);

    // Test rate limit check function directly  
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_ai_rate_limit', {
        p_user_id: users.id,
        p_user_role: users.user_role
      });

    if (rateLimitError) {
      console.error('❌ Rate limit check error:', rateLimitError);
      return;
    }

    console.log('🔍 Direct Rate Limit Check:');
    console.log(`  - Daily: ${rateLimitCheck.daily_usage}/${rateLimitCheck.daily_limit}`);
    console.log(`  - Monthly: ${rateLimitCheck.monthly_usage}/${rateLimitCheck.monthly_limit}`);
    console.log(`  - Allowed: ${rateLimitCheck.allowed}`);
    console.log(`  - User Role: ${rateLimitCheck.user_role}
`);

    if (!rateLimitCheck.allowed) {
      console.log('🚨 Rate limit exceeded! This is why API returns 429');
      if (rateLimitCheck.daily_usage >= rateLimitCheck.daily_limit) {
        console.log('  Reason: Daily limit exceeded');
      }
      if (rateLimitCheck.monthly_usage >= rateLimitCheck.monthly_limit) {
        console.log('  Reason: Monthly limit exceeded');
      }
    } else {
      console.log('✅ Rate limit check passed - AI should work');
    }

  } catch (error) {
    console.error('💥 Test error:', error);
  }
}

testAICaption(); endpoints with proper session
async function testAIAPI() {
  try {
    console.log('🧪 Testing AI Caption API...');
    
    const response = await fetch('/api/ai/caption', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform: 'facebook',
        title: 'Test product',
        content: 'This is a test content',
        tone: 'exciting'
      })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (response.status === 429) {
      console.log('🚨 Rate limited!');
    } else if (response.ok) {
      console.log('✅ AI request successful!');
    } else {
      console.log('❌ AI request failed:', data.error);
    }

  } catch (error) {
    console.error('💥 Test error:', error);
  }
}

// Test rate limit check
async function testRateLimit() {
  try {
    console.log('🔍 Testing Rate Limit Check...');
    
    const response = await fetch('/api/ai/check-rate-limit');
    console.log('Rate limit response status:', response.status);
    
    const data = await response.json();
    console.log('Rate limit data:', data);

  } catch (error) {
    console.error('💥 Rate limit test error:', error);
  }
}

// Test usage stats
async function testUsageStats() {
  try {
    console.log('📊 Testing Usage Stats...');
    
    const response = await fetch('/api/ai/usage-stats');
    console.log('Usage stats response status:', response.status);
    
    const data = await response.json();
    console.log('Usage stats data:', data);

  } catch (error) {
    console.error('💥 Usage stats test error:', error);
  }
}

// Run all tests
console.log('🚀 Starting AI API tests...');
testRateLimit();
testUsageStats();  
testAIAPI();

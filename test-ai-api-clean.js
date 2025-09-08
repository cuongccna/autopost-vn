const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAICaption() {
  try {
    console.log('🧪 Testing AI Caption API directly...\n');

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
    console.log(`🆔 User ID: ${users.id}\n`);

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
    console.log(`  - User Role: ${rateLimitCheck.user_role}\n`);

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

testAICaption();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugAILimits() {
  try {
    console.log('🔍 Debugging AI Rate Limits...\n');

    // 1. Check users
    const { data: users, error: usersError } = await supabase
      .from('autopostvn_users')
      .select('id, email, user_role')
      .order('created_at', { ascending: false })
      .limit(3);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log('👥 Recent Users:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.user_role}): ${user.id}`);
    });

    if (users.length === 0) {
      console.log('❌ No users found');
      return;
    }

    const testUser = users[0];
    console.log(`\n🧪 Testing with user: ${testUser.email} (${testUser.user_role})\n`);

    // 2. Check AI rate limits config
    const { data: rateLimits, error: rateLimitsError } = await supabase
      .from('autopostvn_ai_rate_limits')
      .select('*')
      .order('user_role');

    if (rateLimitsError) {
      console.error('❌ Error fetching rate limits:', rateLimitsError);
    } else {
      console.log('⚙️ AI Rate Limits Config:');
      rateLimits.forEach(limit => {
        console.log(`  - ${limit.user_role}: ${limit.daily_limit}/day, ${limit.monthly_limit}/month`);
      });
    }

    // 3. Check today's usage
    const { data: todayUsage, error: todayError } = await supabase
      .from('autopostvn_ai_usage')
      .select('*')
      .eq('user_id', testUser.id)
      .gte('request_date', new Date().toISOString().split('T')[0])
      .order('request_date', { ascending: false });

    if (todayError) {
      console.error('❌ Error fetching today usage:', todayError);
    } else {
      console.log(`\n📊 Today's AI Usage (${testUser.email}):`);
      console.log(`  - Total requests: ${todayUsage.length}`);
      console.log(`  - Successful: ${todayUsage.filter(u => u.success).length}`);
      console.log(`  - Failed: ${todayUsage.filter(u => !u.success).length}`);
      
      if (todayUsage.length > 0) {
        console.log('  - Recent requests:');
        todayUsage.slice(0, 3).forEach(usage => {
          console.log(`    * ${usage.request_type} at ${usage.request_date} (${usage.success ? 'success' : 'failed'})`);
        });
      }
    }

    // 4. Test rate limit check function
    console.log('\n🔬 Testing check_ai_rate_limit function...');
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_ai_rate_limit', {
        p_user_id: testUser.id,
        p_user_role: testUser.user_role
      });

    if (rateLimitError) {
      console.error('❌ Error checking rate limit:', rateLimitError);
    } else {
      console.log('✅ Rate Limit Check Result:');
      console.log(`  - Daily: ${rateLimitCheck.daily_usage}/${rateLimitCheck.daily_limit}`);
      console.log(`  - Monthly: ${rateLimitCheck.monthly_usage}/${rateLimitCheck.monthly_limit}`);
      console.log(`  - User Role: ${rateLimitCheck.user_role}`);
      console.log(`  - Allowed: ${rateLimitCheck.allowed}`);
      
      if (!rateLimitCheck.allowed) {
        console.log('🚨 AI Usage BLOCKED!');
        if (rateLimitCheck.daily_usage >= rateLimitCheck.daily_limit) {
          console.log('  Reason: Daily limit exceeded');
        }
        if (rateLimitCheck.monthly_usage >= rateLimitCheck.monthly_limit) {
          console.log('  Reason: Monthly limit exceeded');
        }
      }
    }

  } catch (error) {
    console.error('💥 Debug error:', error);
  }
}

debugAILimits();

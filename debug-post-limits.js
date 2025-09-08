const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugPostLimits() {
  try {
    console.log('🔍 Debugging Post Rate Limits...\n');

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

    // 2. Check post rate limits config
    const { data: postRateLimits, error: postRateLimitsError } = await supabase
      .from('autopostvn_post_rate_limits')
      .select('*')
      .order('user_role');

    if (postRateLimitsError) {
      console.error('❌ Error fetching post rate limits:', postRateLimitsError);
    } else {
      console.log('⚙️ Post Rate Limits Config:');
      postRateLimits.forEach(limit => {
        console.log(`  - ${limit.user_role}: ${limit.monthly_limit}/month, ${limit.daily_limit}/day`);
      });
    }

    // 3. Check this month's post usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyPosts, error: monthlyError } = await supabase
      .from('autopostvn_posts')
      .select('id, title, status, created_at')
      .eq('user_id', testUser.id)
      .gte('created_at', startOfMonth.toISOString())
      .order('created_at', { ascending: false });

    if (monthlyError) {
      console.error('❌ Error fetching monthly posts:', monthlyError);
    } else {
      console.log(`\n📊 This Month's Posts (${testUser.email}):`);
      console.log(`  - Total posts: ${monthlyPosts.length}`);
      
      const postsByStatus = monthlyPosts.reduce((acc, post) => {
        acc[post.status] = (acc[post.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`  - By status:`, postsByStatus);
      
      if (monthlyPosts.length > 0) {
        console.log('  - Recent posts:');
        monthlyPosts.slice(0, 5).forEach(post => {
          console.log(`    * "${post.title}" (${post.status}) at ${post.created_at}`);
        });
      }
    }

    // 4. Test post rate limit check function
    console.log('\n🔬 Testing check_post_rate_limit function...');
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_post_rate_limit', {
        p_user_id: testUser.id,
        p_user_role: testUser.user_role
      });

    if (rateLimitError) {
      console.error('❌ Error checking post rate limit:', rateLimitError);
    } else {
      console.log('✅ Post Rate Limit Check Result:');
      console.log(`  - Monthly: ${rateLimitCheck.monthly_usage}/${rateLimitCheck.monthly_limit}`);
      console.log(`  - Daily: ${rateLimitCheck.daily_usage || 'N/A'}/${rateLimitCheck.daily_limit || 'N/A'}`);
      console.log(`  - User Role: ${rateLimitCheck.user_role}`);
      console.log(`  - Allowed: ${rateLimitCheck.allowed}`);
      
      if (!rateLimitCheck.allowed) {
        console.log('🚨 Post limit exceeded!');
        if (rateLimitCheck.monthly_usage >= rateLimitCheck.monthly_limit) {
          console.log('  Reason: Monthly limit exceeded');
        }
      }
    }

  } catch (error) {
    console.error('💥 Debug error:', error);
  }
}

debugPostLimits();

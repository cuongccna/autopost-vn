const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: { schema: 'autopostvn' }
  }
);

async function createTestData() {
  try {
    console.log('🚀 Creating test data...');

    // 1. Create test user (if not exists)
    const testUserId = '59dd7dcb-73b3-4b83-96a6-82811c1413fe';
    
    // 2. Create test social account (Facebook)
    const { data: socialAccount, error: accountError } = await supabase
      .from('social_accounts')
      .insert({
        user_id: testUserId,
        provider: 'facebook',
        username: 'test-facebook-account',
        display_name: 'Test Facebook Account',
        status: 'connected',
        profile_data: {
          id: 'test_facebook_id',
          name: 'Test Facebook Account'
        },
        access_token: 'test_facebook_token_encrypted',
        token_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
      })
      .select()
      .single();

    if (accountError) {
      console.error('❌ Error creating social account:', accountError);
      return;
    }
    
    console.log('✅ Created social account:', socialAccount.id);

    // 3. Create test post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: testUserId,
        content: 'Đây là bài test auto-posting lên Facebook! 🚀\n\nHệ thống AutoPost VN đang hoạt động tốt! #AutoPostVN #TestPost',
        media_url: null,
        platforms: ['facebook'],
        status: 'draft'
      })
      .select()
      .single();

    if (postError) {
      console.error('❌ Error creating post:', postError);
      return;
    }
    
    console.log('✅ Created post:', post.id);

    // 4. Create schedule (5 minutes from now)
    const scheduledTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .insert({
        post_id: post.id,
        social_account_id: socialAccount.id,
        platform: 'facebook',
        scheduled_time: scheduledTime.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (scheduleError) {
      console.error('❌ Error creating schedule:', scheduleError);
      return;
    }
    
    console.log('✅ Created schedule:', schedule.id);
    console.log(`⏰ Scheduled for: ${scheduledTime.toLocaleString()}`);

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Post ID: ${post.id}`);
    console.log(`- Schedule ID: ${schedule.id}`);
    console.log(`- Social Account ID: ${socialAccount.id}`);
    console.log(`- Scheduled Time: ${scheduledTime.toLocaleString()}`);
    console.log('\n💡 Next steps:');
    console.log('1. Go to http://localhost:3000/settings');
    console.log('2. Click "Test Scheduler" to run validation and posting');
    console.log('3. Check "Refresh" to see updated status');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestData();

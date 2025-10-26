/**
 * Test Posts API - Check if providers are included
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fmvxmvahknbzzjzhofql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdnhtdmFoa25ienpqemhvZnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxNzM4NSwiZXhwIjoyMDcxMTkzMzg1fQ.4QdCKgptvWzLEKgAxgLbvfORLLwzu8aXUzTYp1fw_oo'
);

async function testPostsAPI() {
  console.log('🔍 Testing Posts API logic...\n');
  
  const workspaceId = 'ed172ece-2dc6-4ee2-b1cf-0c1301681650';
  
  // Simulate Posts API query
  const { data: posts } = await supabase
    .from('autopostvn_posts')
    .select(`
      *,
      autopostvn_post_schedules (
        id,
        status,
        scheduled_at,
        external_post_id,
        social_account_id,
        autopostvn_social_accounts (
          provider,
          name
        )
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  console.log('📊 Raw Posts from DB:', posts?.length || 0);
  
  if (posts && posts.length > 0) {
    const post = posts[0];
    console.log('\n📄 First Post:');
    console.log('  ID:', post.id);
    console.log('  Content:', post.content?.substring(0, 50) + '...');
    console.log('  Schedules count:', post.autopostvn_post_schedules?.length || 0);
    
    if (post.autopostvn_post_schedules) {
      console.log('\n📅 Schedules:');
      post.autopostvn_post_schedules.forEach((sched, i) => {
        console.log(`  ${i + 1}. Status: ${sched.status}, Provider: ${sched.autopostvn_social_accounts?.provider}`);
      });
      
      // Transform to get providers array (like Posts API should do)
      const providers = [...new Set(post.autopostvn_post_schedules.map(s => {
        const provider = s.autopostvn_social_accounts?.provider;
        if (provider === 'facebook_page') return 'facebook';
        return provider;
      }).filter(Boolean))];
      
      console.log('\n✅ Providers array:', providers);
      console.log('✅ Total schedules:', post.autopostvn_post_schedules.length);
      
      // Calculate what UI should show
      const totalSchedules = post.autopostvn_post_schedules.length;
      const publishedSchedules = post.autopostvn_post_schedules.filter(s => s.status === 'published').length;
      const timeSaved = publishedSchedules * 12;
      
      console.log('\n📈 Expected UI Display:');
      console.log('  Tổng bài đăng:', totalSchedules);
      console.log('  Tỷ lệ thành công:', Math.round((publishedSchedules / totalSchedules) * 100) + '%');
      console.log('  Tiết kiệm thời gian:', timeSaved + 'm');
    }
  }
}

testPostsAPI().catch(console.error);

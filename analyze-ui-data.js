const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fmvxmvahknbzzjzhofql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdnhtdmFoa25ienpqemhvZnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxNzM4NSwiZXhwIjoyMDcxMTkzMzg1fQ.4QdCKgptvWzLEKgAxgLbvfORLLwzu8aXUzTYp1fw_oo'
);

async function analyzeUIData() {
  console.log('\n🔍 Analyzing UI Data vs Database\n');

  // Get the post with schedules
  const { data: posts, error } = await supabase
    .from('autopostvn_posts')
    .select(`
      id,
      title,
      content,
      created_at,
      autopostvn_post_schedules (
        id,
        status,
        published_at,
        social_account_id,
        autopostvn_social_accounts (
          provider,
          name
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Found ${posts?.length || 0} posts\n`);

  posts?.forEach((post, index) => {
    const schedules = post.autopostvn_post_schedules || [];
    const providers = [...new Set(schedules.map(s => {
      const provider = s.autopostvn_social_accounts?.provider || '';
      if (provider === 'facebook_page') return 'facebook';
      if (provider === 'instagram_business') return 'instagram';
      return provider;
    }).filter(Boolean))];

    const publishedCount = schedules.filter(s => s.status === 'published').length;
    const totalSchedules = schedules.length;

    console.log(`${index + 1}. "${post.title.substring(0, 50)}..."`);
    console.log(`   Post ID: ${post.id}`);
    console.log(`   Providers: [${providers.join(', ')}]`);
    console.log(`   Schedules: ${totalSchedules} (${publishedCount} published)`);
    
    if (schedules.length > 0) {
      console.log(`   Pages:`);
      schedules.forEach((s, i) => {
        console.log(`     ${i + 1}. ${s.autopostvn_social_accounts?.name} - ${s.status}`);
      });
    }
    console.log('');
  });

  // Calculate what UI should show
  const publishedPosts = posts?.filter(p => 
    (p.autopostvn_post_schedules || []).some(s => s.status === 'published')
  ) || [];

  const totalSchedules = posts?.reduce((sum, p) => 
    sum + (p.autopostvn_post_schedules?.length || 0), 0
  ) || 0;

  const publishedSchedules = posts?.reduce((sum, p) => 
    sum + (p.autopostvn_post_schedules?.filter(s => s.status === 'published').length || 0), 0
  ) || 0;

  console.log('\n📈 What UI SHOULD Show:');
  console.log(`   Total posts: ${posts?.length || 0}`);
  console.log(`   Total schedules: ${totalSchedules}`);
  console.log(`   Published posts: ${publishedPosts.length}`);
  console.log(`   Published schedules: ${publishedSchedules}`);
  console.log(`   Time saved: ${publishedSchedules * 12}m`);

  console.log('\n📊 What UI IS Showing (from screenshot):');
  console.log(`   Tổng bài đăng: 1`);
  console.log(`   Tỷ lệ thành công: 100%`);
  console.log(`   Tiết kiệm thời gian: 12m`);
  console.log(`   Facebook: 1 bài`);

  console.log('\n❓ Analysis:');
  if (totalSchedules === 4 && publishedSchedules === 4) {
    console.log(`   ⚠️  UI shows "1 bài đăng" but should show "4 bài đăng"`);
    console.log(`   ⚠️  UI shows "12m" but should show "${publishedSchedules * 12}m"`);
    console.log(`   ✅ This means: 1 post × 4 pages = 4 schedules`);
    console.log(`   🔧 Fix: Stats should count schedules, not posts`);
  }
}

analyzeUIData().catch(console.error);

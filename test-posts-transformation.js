const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fmvxmvahknbzzjzhofql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdnhtdmFoa25ienpqemhvZnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxNzM4NSwiZXhwIjoyMDcxMTkzMzg1fQ.4QdCKgptvWzLEKgAxgLbvfORLLwzu8aXUzTYp1fw_oo'
);

async function testPostsTransformation() {
  console.log('\n🔍 Testing Posts API Transformation\n');

  // Simulate what API does
  const { data: posts, error } = await supabase
    .from('autopostvn_posts')
    .select(`
      *,
      autopostvn_post_schedules (
        id,
        status,
        scheduled_at,
        published_at,
        social_account_id,
        autopostvn_social_accounts (
          provider
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

  // Transform like API does
  const transformedPosts = (posts || []).map((post) => {
    const schedules = post.autopostvn_post_schedules || [];
    
    // Get unique platforms from social accounts
    const providers = [...new Set(schedules.map((s) => {
      const provider = s.autopostvn_social_accounts?.provider || '';
      // Map platform names to match UI expectations
      if (provider === 'facebook_page') return 'facebook';
      if (provider === 'instagram_business') return 'instagram';
      if (provider === 'facebook') return 'facebook';
      return provider;
    }).filter(Boolean))];  // Remove empty strings
    
    // Determine overall status
    let status = 'draft';
    if (schedules.length > 0) {
      const allPublished = schedules.every((s) => s.status === 'published');
      const anyFailed = schedules.some((s) => s.status === 'failed');
      const anyScheduled = schedules.some((s) => s.status === 'scheduled');
      
      if (allPublished) status = 'published';
      else if (anyFailed) status = 'failed';
      else if (anyScheduled) status = 'scheduled';
    }

    return {
      id: post.id,
      title: post.title,
      providers,
      status,
      schedules_count: schedules.length
    };
  });

  console.log('✅ Transformed Posts:\n');
  transformedPosts.forEach((post, index) => {
    console.log(`${index + 1}. ${post.title}`);
    console.log(`   Status: ${post.status}`);
    console.log(`   Providers: [${post.providers.join(', ')}]`);
    console.log(`   Schedules: ${post.schedules_count}\n`);
  });

  // Calculate stats
  const totalSchedules = transformedPosts.reduce((sum, post) => sum + post.schedules_count, 0);
  const publishedPosts = transformedPosts.filter(p => p.status === 'published').length;
  const facebookPosts = transformedPosts.filter(p => p.providers.includes('facebook'));
  
  console.log('\n📈 Analytics Stats:');
  console.log(`   Total posts: ${transformedPosts.length}`);
  console.log(`   Total schedules: ${totalSchedules}`);
  console.log(`   Published posts: ${publishedPosts}`);
  console.log(`   Facebook posts: ${facebookPosts.length}`);
  console.log(`   Success rate: ${totalSchedules > 0 ? ((publishedPosts / totalSchedules) * 100).toFixed(1) : 0}%`);

  console.log('\n✅ ChannelStatsChart will now show:');
  console.log(`   Facebook: ${facebookPosts.length} posts`);
  console.log(`   Instagram: ${transformedPosts.filter(p => p.providers.includes('instagram')).length} posts`);
  console.log(`   Zalo: ${transformedPosts.filter(p => p.providers.includes('zalo')).length} posts`);
}

testPostsTransformation().catch(console.error);

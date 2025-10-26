/**
 * Check published posts for analytics
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPublishedPosts() {
  console.log('📊 Checking published posts for analytics...\n');

  // Get published posts
  const { data: schedules, error } = await supabase
    .from('autopostvn_post_schedules')
    .select(`
      id,
      external_post_id,
      published_at,
      status,
      autopostvn_social_accounts!inner(
        name,
        provider,
        workspace_id
      )
    `)
    .eq('status', 'published')
    .not('external_post_id', 'is', null)
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Found ${schedules?.length || 0} published posts\n`);

  if (schedules && schedules.length > 0) {
    schedules.forEach((schedule, index) => {
      const account = schedule.autopostvn_social_accounts;
      console.log(`${index + 1}. ${account.name} (${account.provider})`);
      console.log(`   Post ID: ${schedule.external_post_id}`);
      console.log(`   Published: ${new Date(schedule.published_at).toLocaleString('vi-VN')}`);
      console.log(`   Workspace: ${account.workspace_id}`);
      console.log('');
    });

    const workspace_id = schedules[0].autopostvn_social_accounts.workspace_id;
    console.log('💡 To test analytics API:');
    console.log(`   curl "http://localhost:3000/api/analytics?workspace_id=${workspace_id}"\n`);
  } else {
    console.log('⚠️  No published posts found.');
    console.log('💡 Publish some posts first to see analytics!\n');
  }
}

checkPublishedPosts().catch(console.error);

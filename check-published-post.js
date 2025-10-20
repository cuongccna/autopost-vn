const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPublishedPost() {
console.log('🔍 Checking published post details...\n');

// Get the latest completed schedule
const { data: schedules, error } = await supabase
  .from('autopostvn_post_schedules')
  .select(`
    id,
    post_id,
    social_account_id,
    status,
    published_at,
    external_post_id,
    error_message,
    autopostvn_social_accounts (
      name,
      provider,
      provider_id
    )
  `)
  .eq('status', 'published')
  .order('published_at', { ascending: false })
  .limit(1);

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

if (!schedules || schedules.length === 0) {
  console.log('⚠️  No completed schedules found');
  process.exit(0);
}

const schedule = schedules[0];

console.log('✅ Latest Published Post:');
console.log('  Schedule ID:', schedule.id);
console.log('  Post ID:', schedule.post_id);
console.log('  Status:', schedule.status);
console.log('  Published at:', schedule.published_at);
console.log('\n📱 Social Account:');
console.log('  Name:', schedule.autopostvn_social_accounts.name);
console.log('  Provider:', schedule.autopostvn_social_accounts.provider);
console.log('  Provider ID:', schedule.autopostvn_social_accounts.provider_id);
console.log('\n📊 Result:');
console.log('  External Post ID:', schedule.external_post_id);
console.log('  Message:', schedule.error_message || 'None');

if (schedule.external_post_id) {
  const postId = schedule.external_post_id;
  console.log('\n🔗 Facebook Post URL:');
  console.log(`   https://www.facebook.com/${postId}`);
  
  // Check if it's the correct provider
  if (schedule.autopostvn_social_accounts.provider === 'facebook_page') {
    console.log('\n✅ SUCCESS: Post published using Facebook Page token!');
    console.log('   This means the Page Access Token is working correctly.');
  } else {
    console.log('\n⚠️  WARNING: Post published using user token, not page token');
  }
}
}

checkPublishedPost().catch(console.error);

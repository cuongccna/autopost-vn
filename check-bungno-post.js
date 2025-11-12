const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBungNoPost() {
  console.log('🔍 Checking post "BÙNG NỔ CÙNG AUTOPOSTVN"...\n');

  const { data: posts, error } = await supabase
    .from('autopostvn_scheduled_posts')
    .select('*')
    .ilike('title', '%BÙNG NỔ%')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  if (!posts || posts.length === 0) {
    console.log('❌ No posts found with "BÙNG NỔ" in title');
    process.exit(0);
  }

  console.log(`✅ Found ${posts.length} post(s):\n`);
  posts.forEach((post, index) => {
    console.log(`Post ${index + 1}:`);
    console.log(`  ID: ${post.id}`);
    console.log(`  Title: ${post.title}`);
    console.log(`  Status: ${post.status || 'NULL'} ${post.status === 'scheduled' ? '✅' : '⚠️ PROBLEM!'}`);
    console.log(`  Scheduled At: ${post.scheduled_at}`);
    console.log(`  Providers: ${JSON.stringify(post.providers)}`);
    console.log(`  Created At: ${post.created_at}`);
    console.log('');
  });

  const nonScheduled = posts.filter(p => p.status !== 'scheduled');
  if (nonScheduled.length > 0) {
    console.log('\n⚠️ ISSUE FOUND:');
    console.log(`${nonScheduled.length} post(s) have status != 'scheduled'`);
    console.log('\n📝 PostDetailModal.tsx logic (line 185):');
    console.log('  {post.status === "scheduled" && ( ... show reschedule button ... )}');
    console.log('\n🔧 Why "Lên lịch lại" button is hidden:');
    console.log(`  Current status: "${nonScheduled[0].status || 'NULL'}"`);
    console.log('  Required: "scheduled"');
    console.log('\n💡 Status meanings:');
    console.log('  "scheduled" → Show reschedule button ✅');
    console.log('  "published" → Already posted, no reschedule');
    console.log('  "failed" → Failed, no reschedule');
    console.log('  null/undefined → Shows "Không xác định" ❓');
  } else {
    console.log('\n✅ All posts have status="scheduled", reschedule button should show!');
  }

  process.exit(0);
}

checkBungNoPost();

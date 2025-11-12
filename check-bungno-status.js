const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const { Client } = require('pg');

async function checkBungNoPost() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔍 Checking post "BÙNG NỔ CÙNG AUTOPOSTVN"...\n');

    const result = await client.query(`
      SELECT 
        id,
        title,
        content,
        status,
        scheduled_at,
        providers,
        created_at
      FROM autopostvn_posts
      WHERE title ILIKE '%BÙNG NỔ%' OR content ILIKE '%BÙNG NỔ%'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (result.rows.length === 0) {
      console.log('❌ No posts found with "BÙNG NỔ" in title or content');
      return;
    }

    console.log(`✅ Found ${result.rows.length} post(s):\n`);
    result.rows.forEach((post, index) => {
      console.log(`Post ${index + 1}:`);
      console.log(`  ID: ${post.id}`);
      console.log(`  Title: ${post.title}`);
      console.log(`  Status: ${post.status || 'NULL'} ${post.status === 'scheduled' ? '✅' : '⚠️ PROBLEM!'}`);
      console.log(`  Scheduled At: ${post.scheduled_at}`);
      console.log(`  Providers: ${JSON.stringify(post.providers)}`);
      console.log(`  Created At: ${post.created_at}`);
      console.log('');
    });

    const nonScheduled = result.rows.filter(p => p.status !== 'scheduled');
    if (nonScheduled.length > 0) {
      console.log('\n⚠️ ISSUE FOUND:');
      console.log(`${nonScheduled.length} post(s) have status != 'scheduled'`);
      console.log('\n📝 PostDetailModal.tsx logic (line 185):');
      console.log('  {post.status === "scheduled" && ( ... show reschedule button ... )}');
      console.log('\n🔧 Why "Lên lịch lại" button is hidden:');
      console.log(`  Current status: "${nonScheduled[0].status || 'NULL'}"`);
      console.log('  Required: "scheduled"');
      console.log('\n💡 Fix:');
      console.log(`  UPDATE autopostvn_posts SET status = 'scheduled' WHERE id = '${nonScheduled[0].id}';`);
      console.log('\n💡 Status meanings:');
      console.log('  "scheduled" → Show reschedule button ✅');
      console.log('  "published" → Already posted, no reschedule');
      console.log('  "failed" → Failed, no reschedule');
      console.log('  "draft" → Draft, no reschedule');
      console.log('  null/undefined → Shows "Không xác định" ❓');
    } else {
      console.log('\n✅ All posts have status="scheduled", reschedule button should show!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkBungNoPost();

import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function checkPostStatus() {
  console.log('\n🔍 Checking post with title containing "BÙNG NỔ"...\n');

  try {
    const posts = await sql`
      SELECT 
        id,
        title,
        status,
        scheduled_at,
        providers,
        created_at
      FROM autopostvn_scheduled_posts
      WHERE title ILIKE '%BÙNG NỔ%'
      ORDER BY created_at DESC
      LIMIT 5
    `;

    if (posts.length === 0) {
      console.log('❌ No posts found with "BÙNG NỔ" in title');
      return;
    }

    console.log(`✅ Found ${posts.length} post(s):\n`);
    posts.forEach((post, index) => {
      console.log(`Post ${index + 1}:`);
      console.log(`  ID: ${post.id}`);
      console.log(`  Title: ${post.title}`);
      console.log(`  Status: ${post.status} ${post.status === 'scheduled' ? '✅' : '⚠️'}`);
      console.log(`  Scheduled At: ${post.scheduled_at}`);
      console.log(`  Providers: ${JSON.stringify(post.providers)}`);
      console.log(`  Created At: ${post.created_at}`);
      console.log('');
    });

    // Check if status is not 'scheduled'
    const nonScheduled = posts.filter(p => p.status !== 'scheduled');
    if (nonScheduled.length > 0) {
      console.log('\n⚠️ ISSUE FOUND:');
      console.log(`${nonScheduled.length} post(s) have status != 'scheduled'`);
      console.log('This is why "Lên lịch lại" button is hidden!');
      console.log('\nExpected status values:');
      console.log('  - "scheduled" = Show reschedule button ✅');
      console.log('  - "published" = No reschedule (already posted)');
      console.log('  - "failed" = No reschedule (failed to post)');
      console.log('  - null/undefined/other = Shows "Không xác định" ❓');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

checkPostStatus();

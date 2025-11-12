const dotenv = require('dotenv');
const path = require('path');
const { Client } = require('pg');

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function checkScheduledPosts() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔍 Checking all posts with their statuses...\n');

    const result = await client.query(`
      SELECT 
        id,
        title,
        status,
        scheduled_at,
        providers,
        created_at
      FROM autopostvn_posts
      ORDER BY created_at DESC
      LIMIT 20
    `);

    console.log(`Found ${result.rows.length} post(s):\n`);
    
    const statusCounts = {
      scheduled: 0,
      published: 0,
      failed: 0,
      draft: 0,
      null: 0,
      other: 0
    };

    result.rows.forEach((post, index) => {
      const status = post.status || 'null';
      const statusEmoji = {
        scheduled: '⏰',
        published: '✅',
        failed: '❌',
        draft: '📝',
        null: '❓'
      }[status] || '❓';

      console.log(`${index + 1}. ${statusEmoji} ${status.toUpperCase()}`);
      console.log(`   Title: ${post.title?.substring(0, 60)}...`);
      console.log(`   ID: ${post.id}`);
      console.log(`   Scheduled: ${post.scheduled_at}`);
      console.log('');

      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      } else {
        statusCounts.other++;
      }
    });

    console.log('\n📊 Status Summary:');
    console.log(`  ⏰ Scheduled (can reschedule): ${statusCounts.scheduled}`);
    console.log(`  ✅ Published (cannot reschedule): ${statusCounts.published}`);
    console.log(`  ❌ Failed: ${statusCounts.failed}`);
    console.log(`  📝 Draft: ${statusCounts.draft}`);
    console.log(`  ❓ Null/Unknown: ${statusCounts.null + statusCounts.other}`);

    if (statusCounts.scheduled === 0) {
      console.log('\n⚠️  No posts with status="scheduled" found!');
      console.log('   Only "scheduled" posts can be rescheduled.');
      console.log('\n💡 Possible reasons:');
      console.log('   1. All posts are already published');
      console.log('   2. Posts are in draft state');
      console.log('   3. Status field was not set correctly when creating post');
    } else {
      console.log(`\n✅ You have ${statusCounts.scheduled} post(s) that can be rescheduled!`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkScheduledPosts();

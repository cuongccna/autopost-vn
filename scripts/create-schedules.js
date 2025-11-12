/**
 * Create schedules for existing posts
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE || 'autopost_vn',
  user: process.env.POSTGRES_USER || 'autopost_admin',
  password: process.env.POSTGRES_PASSWORD || 'autopost_vn_secure_2025',
});

async function createSchedules() {
  const client = await pool.connect();
  
  try {
    const WORKSPACE_ID = '486fdee4-7b40-453d-bb69-681b9f3f58f8';
    const USER_ID = '6b02ec4d-e0de-4834-a48f-84999e696891';

    console.log('\n📅 Creating Post Schedules\n');
    console.log('═'.repeat(80));

    // Get social accounts
    const accounts = await client.query(`
      SELECT id, provider, platform_name
      FROM autopostvn_social_accounts
      WHERE workspace_id = $1
    `, [WORKSPACE_ID]);

    console.log(`\n1️⃣  Found ${accounts.rows.length} social accounts:`);
    for (const account of accounts.rows) {
      console.log(`   • ${account.platform_name} (${account.provider})`);
    }

    // Get posts without schedules
    const posts = await client.query(`
      SELECT p.id, p.title, p.status
      FROM autopostvn_posts p
      WHERE p.workspace_id = $1 
        AND p.user_id = $2
        AND NOT EXISTS (
          SELECT 1 FROM autopostvn_post_schedules ps 
          WHERE ps.post_id = p.id
        )
    `, [WORKSPACE_ID, USER_ID]);

    console.log(`\n2️⃣  Found ${posts.rows.length} posts without schedules:`);

    if (posts.rows.length === 0) {
      console.log('   All posts already have schedules!');
      
      // Show existing schedules
      console.log('\n3️⃣  Existing schedules:');
      const existing = await client.query(`
        SELECT 
          p.title,
          p.status as post_status,
          sa.platform_name,
          ps.status as schedule_status,
          ps.scheduled_at
        FROM autopostvn_posts p
        JOIN autopostvn_post_schedules ps ON ps.post_id = p.id
        JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
        WHERE p.workspace_id = $1 AND p.user_id = $2
        ORDER BY p.created_at DESC, sa.platform_name
      `, [WORKSPACE_ID, USER_ID]);

      for (const row of existing.rows) {
        console.log(`\n   📝 ${row.title?.substring(0, 50)}`);
        console.log(`      Post Status: ${row.post_status}`);
        console.log(`      ${row.platform_name}: ${row.schedule_status} @ ${row.scheduled_at}`);
      }

    } else {
      for (const post of posts.rows) {
        console.log(`\n   📝 ${post.title?.substring(0, 50)} (${post.status})`);

        // Create schedule for each account
        for (const account of accounts.rows) {
          await client.query(`
            INSERT INTO autopostvn_post_schedules 
              (post_id, social_account_id, scheduled_at, status, created_at, updated_at)
            VALUES ($1, $2, NOW() + interval '1 hour', $3, NOW(), NOW())
          `, [post.id, account.id, 'pending']);

          console.log(`      ✅ Created schedule for ${account.platform_name}`);
        }

        // Update post status
        await client.query(`
          UPDATE autopostvn_posts
          SET status = 'scheduled', updated_at = NOW()
          WHERE id = $1 AND status = 'draft'
        `, [post.id]);
      }

      console.log(`\n3️⃣  Summary:`);
      console.log(`   ✅ Created schedules for ${posts.rows.length} posts`);
      console.log(`   ✅ ${posts.rows.length * accounts.rows.length} total schedules created`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Done! Refresh your app to see posts.\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createSchedules().catch(console.error);

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    // Check ALL schedules (regardless of status)
    const all = await client.query(`
      SELECT 
        sa.provider,
        ps.status,
        COUNT(*) as count
      FROM autopostvn_post_schedules ps
      JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
      GROUP BY sa.provider, ps.status
      ORDER BY sa.provider, ps.status
    `);
    console.log('All Schedules by Provider:');
    all.rows.forEach(r => console.log('  ' + r.provider + ' - ' + r.status + ': ' + r.count));

    // Check what posts table thinks about status
    const posts = await client.query(`
      SELECT status, COUNT(*) as count
      FROM autopostvn_posts
      GROUP BY status
    `);
    console.log('\nPosts by Status:');
    posts.rows.forEach(r => console.log('  ' + r.status + ': ' + r.count));

    // Check posts with scheduled_at in future
    const future = await client.query(`
      SELECT COUNT(*) as count
      FROM autopostvn_posts 
      WHERE scheduled_at > NOW()
    `);
    console.log('\nPosts scheduled for future: ' + future.rows[0].count);

    // Check Instagram/Zalo schedules
    const others = await client.query(`
      SELECT 
        sa.provider,
        ps.status,
        COUNT(*) as count
      FROM autopostvn_post_schedules ps
      JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
      WHERE sa.provider IN ('instagram', 'instagram_business', 'zalo')
      GROUP BY sa.provider, ps.status
    `);
    console.log('\nInstagram/Zalo Schedules:');
    if (others.rows.length === 0) {
      console.log('  None found');
    } else {
      others.rows.forEach(r => console.log('  ' + r.provider + ' - ' + r.status + ': ' + r.count));
    }

    // Check posts that have scheduled_at but no schedules
    const noSchedules = await client.query(`
      SELECT p.id, p.title, p.scheduled_at, p.status
      FROM autopostvn_posts p
      LEFT JOIN autopostvn_post_schedules ps ON ps.post_id = p.id
      WHERE p.scheduled_at IS NOT NULL 
        AND ps.id IS NULL
      LIMIT 10
    `);
    console.log('\nPosts with scheduled_at but NO schedules:');
    if (noSchedules.rows.length === 0) {
      console.log('  None');
    } else {
      noSchedules.rows.forEach(r => console.log('  ' + r.id + ' - ' + r.title?.substring(0, 30)));
    }

  } finally {
    client.release();
    await pool.end();
  }
}
check();

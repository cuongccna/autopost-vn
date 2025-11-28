require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    console.log('\n📅 Kiểm tra bài đăng có scheduled_at ngày 28/11/2025\n');
    console.log('='.repeat(60));

    // Check posts with scheduled_at for today
    const posts = await client.query(`
      SELECT 
        p.id,
        p.title,
        p.status,
        p.scheduled_at,
        p.scheduled_at AT TIME ZONE 'Asia/Ho_Chi_Minh' as local_time,
        p.workspace_id,
        (SELECT COUNT(*) FROM autopostvn_post_schedules ps WHERE ps.post_id = p.id) as schedule_count
      FROM autopostvn_posts p
      WHERE DATE(p.scheduled_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = '2025-11-28'
      ORDER BY p.scheduled_at
    `);

    console.log('\nPosts với scheduled_at ngày 28/11:', posts.rows.length);
    
    posts.rows.forEach((r, i) => {
      console.log('\n---', i + 1, '---');
      console.log('ID:', r.id);
      console.log('Title:', r.title?.substring(0, 50));
      console.log('Post Status:', r.status);
      console.log('Scheduled (VN):', r.local_time);
      console.log('Schedule records:', r.schedule_count);
    });

    // Check all schedules
    const allSchedules = await client.query(`
      SELECT 
        ps.id,
        ps.status,
        ps.scheduled_at AT TIME ZONE 'Asia/Ho_Chi_Minh' as local_time,
        p.title,
        sa.provider
      FROM autopostvn_post_schedules ps
      JOIN autopostvn_posts p ON p.id = ps.post_id
      JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
      ORDER BY ps.scheduled_at DESC
      LIMIT 20
    `);

    console.log('\n\n📋 20 schedules gần nhất:');
    allSchedules.rows.forEach((r, i) => {
      console.log((i+1) + '. [' + r.status + '] ' + r.provider + ' - ' + r.local_time + ' - ' + r.title?.substring(0, 30));
    });

    // Check posts without schedules
    const noSchedules = await client.query(`
      SELECT 
        p.id,
        p.title,
        p.status,
        p.scheduled_at AT TIME ZONE 'Asia/Ho_Chi_Minh' as local_time,
        p.providers
      FROM autopostvn_posts p
      LEFT JOIN autopostvn_post_schedules ps ON ps.post_id = p.id
      WHERE p.status = 'scheduled' AND ps.id IS NULL
    `);

    console.log('\n\n⚠️  Posts scheduled nhưng KHÔNG có schedule records:', noSchedules.rows.length);
    noSchedules.rows.forEach(r => {
      console.log('  -', r.title?.substring(0, 40), '| providers:', r.providers);
    });

  } finally {
    client.release();
    await pool.end();
  }
}
check();

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    console.log('\n📅 Kiểm tra bài đăng ngày 28/11/2025\n');
    console.log('='.repeat(60));

    // Check schedules for today (Nov 28, 2025)
    const today = await client.query(`
      SELECT 
        ps.id,
        ps.status,
        ps.scheduled_at,
        ps.scheduled_at AT TIME ZONE 'Asia/Ho_Chi_Minh' as local_time,
        ps.published_at,
        ps.error_message,
        p.title,
        sa.provider,
        sa.platform_name
      FROM autopostvn_post_schedules ps
      JOIN autopostvn_posts p ON p.id = ps.post_id
      JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
      WHERE DATE(ps.scheduled_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = '2025-11-28'
      ORDER BY ps.scheduled_at
    `);

    console.log('\nTổng số schedules:', today.rows.length);
    
    today.rows.forEach((r, i) => {
      console.log('\n---', i + 1, '---');
      console.log('Title:', r.title?.substring(0, 50));
      console.log('Provider:', r.provider, '-', r.platform_name);
      console.log('Scheduled (UTC):', r.scheduled_at);
      console.log('Scheduled (VN):', r.local_time);
      console.log('Status:', r.status);
      if (r.published_at) console.log('Published:', r.published_at);
      if (r.error_message) console.log('Error:', r.error_message?.substring(0, 100));
    });

    // Check current time
    const now = await client.query(`
      SELECT 
        NOW() as utc_now,
        NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' as vn_now
    `);
    console.log('\n\n⏰ Thời gian hiện tại:');
    console.log('UTC:', now.rows[0].utc_now);
    console.log('VN:', now.rows[0].vn_now);

    // Check pending schedules that should have been processed
    const pending = await client.query(`
      SELECT COUNT(*) as count
      FROM autopostvn_post_schedules
      WHERE status = 'pending'
        AND scheduled_at <= NOW()
    `);
    console.log('\n⚠️  Pending schedules quá hạn:', pending.rows[0].count);

  } finally {
    client.release();
    await pool.end();
  }
}
check();

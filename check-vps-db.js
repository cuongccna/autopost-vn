require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    console.log('\n=== VPS DATABASE CHECK - Nov 28, 2025 ===\n');

    // Check schedules for Nov 28
    const today = await client.query(`
      SELECT 
        ps.id,
        ps.status,
        ps.scheduled_at,
        ps.scheduled_at AT TIME ZONE 'Asia/Ho_Chi_Minh' as vn_time,
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

    console.log('Schedules for Nov 28, 2025:', today.rows.length);
    
    today.rows.forEach((r, i) => {
      console.log('\n--- Schedule', i + 1, '---');
      console.log('Title:', r.title?.substring(0, 50));
      console.log('Provider:', r.provider, '-', r.platform_name);
      console.log('Scheduled (UTC):', r.scheduled_at);
      console.log('Scheduled (VN):', r.vn_time);
      console.log('Status:', r.status);
      if (r.published_at) console.log('Published at:', r.published_at);
      if (r.error_message) console.log('Error:', r.error_message?.substring(0, 100));
    });

    // Current time
    const now = await client.query(`SELECT NOW() as utc_now, NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' as vn_now`);
    console.log('\n\n=== Current Time ===');
    console.log('UTC:', now.rows[0].utc_now);
    console.log('Vietnam:', now.rows[0].vn_now);

    // Overdue pending
    const pending = await client.query(`
      SELECT COUNT(*) as count 
      FROM autopostvn_post_schedules 
      WHERE status = 'pending' AND scheduled_at <= NOW()
    `);
    console.log('\n=== Overdue Pending Schedules ===');
    console.log('Count:', pending.rows[0].count);

    // Recent 20 schedules
    const recent = await client.query(`
      SELECT 
        ps.status,
        ps.scheduled_at AT TIME ZONE 'Asia/Ho_Chi_Minh' as vn_time,
        p.title,
        sa.provider
      FROM autopostvn_post_schedules ps
      JOIN autopostvn_posts p ON p.id = ps.post_id
      JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
      ORDER BY ps.scheduled_at DESC
      LIMIT 20
    `);

    console.log('\n=== Recent 20 Schedules ===');
    recent.rows.forEach((r, i) => {
      const time = new Date(r.vn_time).toLocaleString('vi-VN');
      console.log(`${i + 1}. [${r.status}] ${r.provider} - ${time} - ${r.title?.substring(0, 30)}`);
    });

    // Posts with scheduled status but no schedule records
    const noSchedules = await client.query(`
      SELECT p.id, p.title, p.status, p.scheduled_at, p.providers
      FROM autopostvn_posts p
      LEFT JOIN autopostvn_post_schedules ps ON ps.post_id = p.id
      WHERE p.status = 'scheduled' AND ps.id IS NULL
    `);
    
    console.log('\n=== Posts with "scheduled" status but NO schedule records ===');
    console.log('Count:', noSchedules.rows.length);
    noSchedules.rows.forEach(r => {
      console.log('  -', r.title?.substring(0, 40), '| providers:', r.providers);
    });

  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(console.error);

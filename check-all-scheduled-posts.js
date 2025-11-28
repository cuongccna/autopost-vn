require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    console.log('\n📅 Kiểm tra TẤT CẢ posts có scheduled_at\n');
    console.log('='.repeat(60));

    // Check ALL posts with scheduled_at
    const posts = await client.query(`
      SELECT 
        p.id,
        p.title,
        p.status,
        p.scheduled_at,
        p.scheduled_at AT TIME ZONE 'Asia/Ho_Chi_Minh' as local_time,
        p.providers,
        p.workspace_id,
        (SELECT COUNT(*) FROM autopostvn_post_schedules ps WHERE ps.post_id = p.id) as schedule_count
      FROM autopostvn_posts p
      WHERE p.scheduled_at IS NOT NULL
      ORDER BY p.scheduled_at DESC
      LIMIT 30
    `);

    console.log('\nTổng posts có scheduled_at:', posts.rows.length);
    
    posts.rows.forEach((r, i) => {
      const localDate = new Date(r.scheduled_at);
      const vnDate = localDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      console.log('\n---', i + 1, '---');
      console.log('ID:', r.id);
      console.log('Title:', r.title?.substring(0, 40));
      console.log('Post Status:', r.status);
      console.log('scheduled_at (raw):', r.scheduled_at);
      console.log('VN time:', vnDate);
      console.log('Providers:', r.providers);
      console.log('Schedule records:', r.schedule_count);
    });

    // Check timezone handling
    console.log('\n\n⏰ Server Timezone Check:');
    const tz = await client.query(`
      SELECT 
        NOW() as now_utc,
        NOW() AT TIME ZONE 'UTC' as utc,
        NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' as vietnam,
        current_setting('TIMEZONE') as server_tz
    `);
    console.log('Server TZ setting:', tz.rows[0].server_tz);
    console.log('NOW():', tz.rows[0].now_utc);
    console.log('NOW() AT TZ UTC:', tz.rows[0].utc);
    console.log('NOW() AT TZ VN:', tz.rows[0].vietnam);

  } finally {
    client.release();
    await pool.end();
  }
}
check();

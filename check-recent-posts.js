require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    console.log('\n📅 Tìm TẤT CẢ posts gần đây (cuối tháng 11)\n');
    console.log('='.repeat(60));

    // Check ALL posts created recently
    const posts = await client.query(`
      SELECT 
        p.id,
        p.title,
        p.status,
        p.scheduled_at,
        p.created_at,
        p.providers,
        (SELECT COUNT(*) FROM autopostvn_post_schedules ps WHERE ps.post_id = p.id) as schedule_count
      FROM autopostvn_posts p
      ORDER BY p.created_at DESC
      LIMIT 20
    `);

    console.log('\n20 posts mới nhất:');
    
    posts.rows.forEach((r, i) => {
      const createdDate = new Date(r.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      const scheduledDate = r.scheduled_at ? new Date(r.scheduled_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'N/A';
      console.log('\n---', i + 1, '---');
      console.log('Title:', r.title?.substring(0, 50));
      console.log('Status:', r.status);
      console.log('Created:', createdDate);
      console.log('Scheduled:', scheduledDate);
      console.log('Providers:', r.providers);
      console.log('Schedule records:', r.schedule_count);
    });

    // Check posts with title containing keywords from calendar
    const keywords = await client.query(`
      SELECT 
        p.id,
        p.title,
        p.status,
        p.scheduled_at,
        p.created_at
      FROM autopostvn_posts p
      WHERE p.title ILIKE '%Chào cả nhà%' 
         OR p.title ILIKE '%Chia sẻ kinh%'
         OR p.title ILIKE '%Hướng dẫn%'
         OR p.title ILIKE '%Giới thiệu%'
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    console.log('\n\n🔍 Posts với keywords từ Calendar:');
    if (keywords.rows.length === 0) {
      console.log('  Không tìm thấy!');
    } else {
      keywords.rows.forEach(r => {
        console.log('  -', r.title?.substring(0, 50), '|', r.status);
      });
    }

  } finally {
    client.release();
    await pool.end();
  }
}
check();

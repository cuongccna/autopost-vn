require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    // All unique statuses
    const statuses = await client.query(`
      SELECT DISTINCT status FROM autopostvn_post_schedules
    `);
    console.log('\n=== All unique statuses in post_schedules ===');
    console.log(statuses.rows.map(r => r.status).join(', '));

    // Check Nov 28 schedules in detail
    const nov28 = await client.query(`
      SELECT 
        ps.id,
        ps.status,
        ps.created_at,
        ps.updated_at,
        ps.scheduled_at
      FROM autopostvn_post_schedules ps
      WHERE DATE(ps.scheduled_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = '2025-11-28'
    `);
    
    console.log('\n=== Nov 28 schedules detail ===');
    nov28.rows.forEach(r => {
      console.log(`ID: ${r.id}`);
      console.log(`  Status: ${r.status}`);
      console.log(`  Created: ${r.created_at}`);
      console.log(`  Updated: ${r.updated_at}`);
      console.log(`  Scheduled: ${r.scheduled_at}`);
      console.log('');
    });

  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(console.error);

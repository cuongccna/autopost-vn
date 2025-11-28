require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    // Check constraint
    const constraint = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'autopostvn_post_schedules'::regclass
      AND contype = 'c'
    `);
    
    console.log('\n=== Constraints on autopostvn_post_schedules ===');
    constraint.rows.forEach(r => {
      console.log(`${r.conname}: ${r.definition}`);
    });

    // Fix: Update 'scheduled' to 'pending'
    console.log('\n=== Fixing status values ===');
    
    const update = await client.query(`
      UPDATE autopostvn_post_schedules
      SET status = 'pending', updated_at = NOW()
      WHERE status = 'scheduled'
      RETURNING id, status
    `);
    
    console.log(`Updated ${update.rowCount} schedules from 'scheduled' to 'pending'`);

  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(console.error);

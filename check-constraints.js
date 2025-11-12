const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'autopost_vn',
  user: 'autopost_admin',
  password: 'autopost_vn_secure_2025',
});

async function checkConstraints() {
  const client = await pool.connect();
  try {
    console.log('📋 Checking constraints on autopostvn_post_schedules...\n');
    
    const result = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition 
      FROM pg_constraint 
      WHERE conrelid = 'autopostvn_post_schedules'::regclass 
        AND contype = 'c'
    `);
    
    console.log('Constraints:');
    console.table(result.rows);
    
    // Check allowed status values
    const statusConstraint = result.rows.find(r => r.conname.includes('status'));
    if (statusConstraint) {
      console.log('\n📊 Status constraint details:');
      console.log(statusConstraint.definition);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkConstraints();

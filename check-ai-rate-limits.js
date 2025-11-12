const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'autopost_vn',
  user: 'autopost_admin',
  password: 'autopost_vn_secure_2025',
});

async function checkAIRateLimits() {
  const client = await pool.connect();
  try {
    console.log('📊 Checking AI Rate Limits table...\n');
    
    // Check table data
    const result = await client.query(`
      SELECT * FROM autopostvn_ai_rate_limits ORDER BY user_role
    `);
    
    console.log('AI Rate Limits in database:');
    console.table(result.rows);
    
    // Test function for free user
    console.log('\n🧪 Testing check_ai_rate_limit for FREE user:');
    const freeTest = await client.query(`
      SELECT check_ai_rate_limit($1, $2) as result
    `, ['6b02ec4d-e0de-4834-a48f-84999e696891', 'free']);
    console.log(JSON.stringify(freeTest.rows[0].result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAIRateLimits();

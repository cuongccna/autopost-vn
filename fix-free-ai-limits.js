const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'autopost_vn',
  user: 'autopost_admin',
  password: 'autopost_vn_secure_2025',
});

async function fixFreeAILimits() {
  const client = await pool.connect();
  try {
    console.log('🔧 Fixing FREE plan AI limits...\n');
    
    // Update FREE plan to have 0 AI limits (no AI access)
    const result = await client.query(`
      UPDATE autopostvn_ai_rate_limits 
      SET daily_limit = 0, monthly_limit = 0, updated_at = NOW()
      WHERE user_role = 'free'
      RETURNING *
    `);
    
    console.log('✅ Updated FREE plan AI limits:');
    console.table(result.rows);
    
    // Verify all limits
    console.log('\n📊 All AI Rate Limits after update:');
    const all = await client.query(`
      SELECT * FROM autopostvn_ai_rate_limits ORDER BY user_role
    `);
    console.table(all.rows);
    
    // Test function again
    console.log('\n🧪 Testing check_ai_rate_limit for FREE user:');
    const test = await client.query(`
      SELECT check_ai_rate_limit($1, $2) as result
    `, ['6b02ec4d-e0de-4834-a48f-84999e696891', 'free']);
    console.log(JSON.stringify(test.rows[0].result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixFreeAILimits();

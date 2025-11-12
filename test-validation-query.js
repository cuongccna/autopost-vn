const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'autopost_vn',
  user: 'autopost_admin',
  password: 'autopost_vn_secure_2025'
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

async function testValidation() {
  try {
    console.log('🔍 Testing validation query...\n');
    
    // Get a pending schedule
    const scheduleResult = await query(`
      SELECT ps.*, p.status as post_status
      FROM autopostvn_post_schedules ps
      JOIN autopostvn_posts p ON p.id = ps.post_id
      WHERE ps.status = 'pending'
      LIMIT 1
    `);
    
    if (scheduleResult.rows.length === 0) {
      console.log('❌ No pending schedules found');
      process.exit(0);
    }
    
    const schedule = scheduleResult.rows[0];
    console.log('📋 Found schedule:', {
      id: schedule.id,
      post_id: schedule.post_id,
      social_account_id: schedule.social_account_id,
      scheduled_at: schedule.scheduled_at
    });
    
    // Test the query that was failing
    console.log('\n🔍 Testing social account query...\n');
    const accountResult = await query(`
      SELECT id, provider, provider_id, name, status, token_encrypted, 
             expires_at, metadata
      FROM autopostvn_social_accounts
      WHERE id = $1
    `, [schedule.social_account_id]);
    
    if (accountResult.rows.length === 0) {
      console.log('❌ Social account not found');
    } else {
      const account = accountResult.rows[0];
      console.log('✅ Social account found:', {
        id: account.id,
        provider: account.provider,
        name: account.name,
        status: account.status,
        has_token: !!account.token_encrypted
      });
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testValidation();

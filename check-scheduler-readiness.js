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

async function checkSchedulerReadiness() {
  try {
    console.log('🔍 Checking Scheduler Readiness...\n');
    
    // 1. Check pending schedules
    console.log('1️⃣ Checking pending schedules...');
    const schedulesResult = await query(`
      SELECT 
        ps.id,
        ps.post_id,
        ps.social_account_id,
        ps.scheduled_at,
        ps.status,
        p.content,
        p.providers
      FROM autopostvn_post_schedules ps
      JOIN autopostvn_posts p ON p.id = ps.post_id
      WHERE ps.status = 'pending'
      ORDER BY ps.scheduled_at
    `);
    
    console.log(`   Found ${schedulesResult.rows.length} pending schedule(s)\n`);
    
    if (schedulesResult.rows.length === 0) {
      console.log('✅ No pending schedules to process');
      await pool.end();
      return;
    }
    
    // 2. Check each schedule
    for (const schedule of schedulesResult.rows) {
      console.log(`📋 Schedule: ${schedule.id}`);
      console.log(`   Post ID: ${schedule.post_id}`);
      console.log(`   Scheduled at: ${schedule.scheduled_at}`);
      console.log(`   Content: ${schedule.content?.substring(0, 50)}...`);
      
      // 3. Check social account
      const accountResult = await query(`
        SELECT id, provider, provider_id, name, status, token_encrypted, 
               expires_at, metadata
        FROM autopostvn_social_accounts
        WHERE id = $1
      `, [schedule.social_account_id]);
      
      if (accountResult.rows.length === 0) {
        console.log(`   ❌ Social account not found: ${schedule.social_account_id}\n`);
        continue;
      }
      
      const account = accountResult.rows[0];
      console.log(`   ✅ Social Account: ${account.name} (${account.provider})`);
      console.log(`   ✅ Status: ${account.status}`);
      console.log(`   ✅ Has Token: ${!!account.token_encrypted}`);
      
      // Check if token is expired
      if (account.expires_at) {
        const now = new Date();
        const expiresAt = new Date(account.expires_at);
        if (expiresAt < now) {
          console.log(`   ⚠️ Token expired at: ${account.expires_at}`);
        } else {
          console.log(`   ✅ Token expires at: ${account.expires_at}`);
        }
      }
      
      console.log('');
    }
    
    console.log('\n✅ All checks passed! Scheduler should be able to process these schedules.');
    console.log('\n📌 Next steps:');
    console.log('   1. Wait for scheduled time to arrive');
    console.log('   2. Or open http://localhost:3000/dashboard/calendar');
    console.log('   3. Use SchedulerMonitor component to trigger manually');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

checkSchedulerReadiness();

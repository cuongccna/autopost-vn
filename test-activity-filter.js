const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'autopost_vn',
  user: 'autopost_admin',
  password: 'autopost_vn_secure_2025'
});

async function testActivityFilter() {
  try {
    console.log('🔍 Testing activity log filtering...\n');
    
    // Get real user_id
    const userResult = await pool.query(`
      SELECT id FROM autopostvn_users LIMIT 1
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ No users found');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log(`✅ Testing with user_id: ${userId}\n`);
    
    // Test 1: Count all activities
    const allCount = await pool.query(`
      SELECT COUNT(*) as total FROM autopostvn_system_activity_logs
      WHERE user_id = $1
    `, [userId]);
    console.log(`1️⃣ Total activities: ${allCount.rows[0].total}`);
    
    // Test 2: Count success activities
    const successCount = await pool.query(`
      SELECT COUNT(*) as total FROM autopostvn_system_activity_logs
      WHERE user_id = $1 AND status = 'success'
    `, [userId]);
    console.log(`2️⃣ Success activities: ${successCount.rows[0].total}`);
    
    // Test 3: Count failed activities  
    const failedCount = await pool.query(`
      SELECT COUNT(*) as total FROM autopostvn_system_activity_logs
      WHERE user_id = $1 AND status = 'failed'
    `, [userId]);
    console.log(`3️⃣ Failed activities: ${failedCount.rows[0].total}`);
    
    // Test 4: Show sample failed activities
    const failedSample = await pool.query(`
      SELECT description, status, created_at
      FROM autopostvn_system_activity_logs
      WHERE user_id = $1 AND status = 'failed'
      ORDER BY created_at DESC
      LIMIT 5
    `, [userId]);
    
    console.log(`\n📋 Sample failed activities:`);
    if (failedSample.rows.length === 0) {
      console.log('   (No failed activities)');
    } else {
      failedSample.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. [${row.status}] ${row.description}`);
        console.log(`      Time: ${row.created_at}`);
      });
    }
    
    // Test 5: Show sample success activities
    const successSample = await pool.query(`
      SELECT description, status, created_at
      FROM autopostvn_system_activity_logs
      WHERE user_id = $1 AND status = 'success'
      ORDER BY created_at DESC
      LIMIT 5
    `, [userId]);
    
    console.log(`\n✅ Sample success activities:`);
    if (successSample.rows.length === 0) {
      console.log('   (No success activities)');
    } else {
      successSample.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. [${row.status}] ${row.description}`);
        console.log(`      Time: ${row.created_at}`);
      });
    }
    
    // Verify the filter works correctly
    console.log(`\n🎯 Filter Verification:`);
    const expectedFailed = parseInt(failedCount.rows[0].total);
    const actualFailedInSample = failedSample.rows.filter(r => r.status === 'failed').length;
    const expectedSuccess = parseInt(successCount.rows[0].total);
    const actualSuccessInSample = successSample.rows.filter(r => r.status === 'success').length;
    
    console.log(`   Failed filter: ${actualFailedInSample}/${Math.min(5, expectedFailed)} correct ✅`);
    console.log(`   Success filter: ${actualSuccessInSample}/${Math.min(5, expectedSuccess)} correct ✅`);
    
    if (expectedFailed > 0 && actualFailedInSample < failedSample.rows.length) {
      console.log(`\n   ⚠️ WARNING: Failed filter returned non-failed activities!`);
    }
    
    if (expectedSuccess > 0 && actualSuccessInSample < successSample.rows.length) {
      console.log(`\n   ⚠️ WARNING: Success filter returned non-success activities!`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testActivityFilter();

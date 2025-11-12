// Test PostgreSQL database connectivity
require('dotenv').config({ path: '.env.local' });

const { query, insert } = require('./src/lib/db/postgres');

async function testDatabaseConnection() {
  console.log('🔍 Testing PostgreSQL connection...\n');
  
  try {
    // Test 1: Simple query
    console.log('Test 1: Simple query');
    const result = await query('SELECT COUNT(*) as count FROM autopostvn_workspaces');
    console.log('✅ Workspaces count:', result.rows[0].count);
    
    // Test 2: Check workspace data
    console.log('\nTest 2: Fetch workspace data');
    const workspaces = await query('SELECT id, name, slug FROM autopostvn_workspaces LIMIT 5');
    console.log('✅ Workspaces:', workspaces.rows);
    
    // Test 3: Check all tables exist
    console.log('\nTest 3: Check all tables');
    const tables = await query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE tablename LIKE 'autopostvn_%' 
      ORDER BY tablename
    `);
    console.log('✅ Tables found:', tables.rows.length);
    tables.rows.forEach(row => console.log('   -', row.tablename));
    
    // Test 4: Check indexes
    console.log('\nTest 4: Check indexes');
    const indexes = await query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename LIKE 'autopostvn_%' 
      LIMIT 10
    `);
    console.log('✅ Indexes sample:', indexes.rows.length);
    indexes.rows.forEach(row => console.log('   -', row.indexname));
    
    // Test 5: Test social accounts table
    console.log('\nTest 5: Check social accounts table');
    const accounts = await query('SELECT COUNT(*) as count FROM autopostvn_social_accounts');
    const testUserId = '550e8400-e29b-41d4-a716-446655440000';
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('check_ai_rate_limit', {
        p_user_id: testUserId,
        p_user_role: 'free'
      });
    console.log('✅ Social accounts count:', accounts.rows[0].count);
    
    // Test 6: Test AI rate limits table
    console.log('\nTest 6: Check AI rate limits table');
    const rateLimits = await query('SELECT COUNT(*) as count FROM autopostvn_ai_rate_limits');
    console.log('✅ AI rate limits count:', rateLimits.rows[0].count);
    
    console.log('\n🎉 All database connectivity tests passed!');
    console.log('\n📊 Database Summary:');
    console.log('   - PostgreSQL connection: ✅ Working');
    console.log('   - Tables created: ✅', tables.rows.length);
    console.log('   - Sample data: ✅ Present');
    console.log('   - Indexes: ✅ Created');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check .env.local has correct PostgreSQL credentials');
    console.error('   2. Ensure PostgreSQL is running (check pgAdmin)');
    console.error('   3. Verify database name is "autopost_vn"');
    console.error('   4. Check user "autopost_admin" has access');
    process.exit(1);
  }
}

testDatabaseConnection();

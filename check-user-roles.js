const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'autopost_vn',
  user: 'autopost_admin',
  password: 'autopost_vn_secure_2025'
});

async function checkUserRole() {
  try {
    console.log('🔍 Checking user roles...\n');
    
    // Get all users with their roles
    const result = await pool.query(`
      SELECT 
        id,
        email,
        full_name,
        user_role,
        created_at
      FROM autopostvn_users
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Found ${result.rows.length} user(s):\n`);
    
    result.rows.forEach((user, i) => {
      console.log(`${i + 1}. ${user.full_name || 'No Name'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.user_role || 'free'} ${getRoleEmoji(user.user_role)}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
    
    // Count by role
    const roleCounts = await pool.query(`
      SELECT 
        COALESCE(user_role, 'free') as user_role,
        COUNT(*) as count
      FROM autopostvn_users
      GROUP BY user_role
      ORDER BY count DESC
    `);
    
    console.log('📈 Users by role:');
    roleCounts.rows.forEach(row => {
      console.log(`   ${getRoleEmoji(row.user_role)} ${row.user_role}: ${row.count} user(s)`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

function getRoleEmoji(role) {
  switch (role) {
    case 'free':
      return '👤';
    case 'professional':
      return '👑';
    case 'enterprise':
      return '💎';
    default:
      return '👤';
  }
}

checkUserRole();

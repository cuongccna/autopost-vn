const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'autopost_vn',
  user: 'autopost_admin',
  password: 'autopost_vn_secure_2025'
});

async function checkUser() {
  try {
    const email = 'c@gmail.com';
    console.log(`🔍 Checking user: ${email}\n`);
    
    // Check in users table
    const userResult = await pool.query(`
      SELECT id, email, full_name, user_role, password_hash, created_at
      FROM autopostvn_users
      WHERE email = $1
    `, [email]);
    
    console.log('📋 In autopostvn_users table:');
    if (userResult.rows.length === 0) {
      console.log('   ❌ User NOT found\n');
    } else {
      const user = userResult.rows[0];
      console.log(`   ✅ User found!`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Full Name: ${user.full_name || 'N/A'}`);
      console.log(`   Role: ${user.user_role}`);
      console.log(`   Has Password: ${!!user.password_hash}`);
      console.log(`   Created: ${user.created_at}\n`);
    }
    
    // Check in workspaces table (old location)
    const workspaceResult = await pool.query(`
      SELECT id, name, slug, settings
      FROM autopostvn_workspaces
      WHERE settings->>'user_email' = $1
    `, [email]);
    
    console.log('📋 In autopostvn_workspaces table (old location):');
    if (workspaceResult.rows.length === 0) {
      console.log('   ❌ NOT found in workspaces\n');
    } else {
      const workspace = workspaceResult.rows[0];
      console.log(`   ⚠️ Found in workspaces (legacy)!`);
      console.log(`   ID: ${workspace.id}`);
      console.log(`   Name: ${workspace.name}`);
      console.log(`   Slug: ${workspace.slug}`);
      console.log(`   Settings: ${JSON.stringify(workspace.settings, null, 2)}\n`);
    }
    
    // Suggest migration if found in workspaces
    if (workspaceResult.rows.length > 0 && userResult.rows.length === 0) {
      console.log('💡 SUGGESTION: User exists in workspaces but not in users table.');
      console.log('   Need to migrate this user to autopostvn_users table.\n');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkUser();

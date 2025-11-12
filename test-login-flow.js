/**
 * Test Login Flow
 * 
 * This script tests the login process by calling the NextAuth credentials provider
 */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'autopost_vn',
  user: 'autopost_admin',
  password: 'autopost_vn_secure_2025'
});

async function testLogin(email, password) {
  try {
    console.log(`🔐 Testing login for: ${email}\n`);
    
    // Step 1: Find user by email (same as auth.ts does)
    console.log('1️⃣ Looking up user in database...');
    const result = await pool.query(
      `SELECT * FROM autopostvn_users WHERE email = $1 LIMIT 1`,
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('   ❌ User not found\n');
      await pool.end();
      return false;
    }
    
    const user = result.rows[0];
    console.log('   ✅ User found!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Full Name: ${user.full_name}`);
    console.log(`   Role: ${user.user_role}\n`);
    
    // Step 2: Verify password hash exists
    console.log('2️⃣ Checking password hash...');
    if (!user.password_hash) {
      console.log('   ❌ No password hash found\n');
      await pool.end();
      return false;
    }
    console.log('   ✅ Password hash exists\n');
    
    // Step 3: Compare password
    console.log('3️⃣ Verifying password...');
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordValid) {
      console.log('   ❌ Invalid password\n');
      await pool.end();
      return false;
    }
    console.log('   ✅ Password is correct!\n');
    
    // Step 4: Check workspace
    console.log('4️⃣ Checking workspace...');
    const workspaceResult = await pool.query(
      `SELECT id, name, slug FROM autopostvn_workspaces WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );
    
    if (workspaceResult.rows.length === 0) {
      console.log('   ⚠️ No workspace found (will be auto-created on login)');
    } else {
      const workspace = workspaceResult.rows[0];
      console.log('   ✅ Workspace found!');
      console.log(`   ID: ${workspace.id}`);
      console.log(`   Name: ${workspace.name}`);
      console.log(`   Slug: ${workspace.slug}`);
    }
    
    console.log('\n✅ Login test PASSED! User can login successfully.\n');
    
    await pool.end();
    return true;
    
  } catch (error) {
    console.error('\n❌ Login test FAILED:', error.message);
    await pool.end();
    return false;
  }
}

// Test with c@gmail.com
// You'll need to provide the actual password used during registration
const testEmail = 'c@gmail.com';
const testPassword = process.argv[2] || 'test123'; // Get password from command line or use default

console.log('🧪 Login Flow Test\n');
console.log('=' .repeat(60));
console.log(`Testing with: ${testEmail}`);
console.log(`Password: ${'*'.repeat(testPassword.length)}`);
console.log('=' .repeat(60) + '\n');

testLogin(testEmail, testPassword);

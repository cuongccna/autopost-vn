/**
 * Script to find user ID from email and sync to autopostvn_users if needed
 * Run: node scripts/find-user.js <email>
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE || 'autopost_vn',
  user: process.env.POSTGRES_USER || 'autopost_admin',
  password: process.env.POSTGRES_PASSWORD || 'autopost_vn_secure_2025',
});

async function findAndSyncUser(email) {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 Searching for user:', email);
    console.log('═'.repeat(60));

    // 1. Check NextAuth users table
    console.log('\n📧 Checking NextAuth users...');
    const nextAuthResult = await client.query(
      'SELECT id, name, email, image FROM "User" WHERE email = $1',
      [email]
    );

    if (nextAuthResult.rows.length === 0) {
      console.log('❌ User not found in NextAuth users table');
      console.log('💡 User needs to sign up first');
      return;
    }

    const nextAuthUser = nextAuthResult.rows[0];
    console.log('✅ Found in NextAuth:');
    console.log(`   ID: ${nextAuthUser.id}`);
    console.log(`   Name: ${nextAuthUser.name}`);
    console.log(`   Email: ${nextAuthUser.email}`);

    // 2. Check if user exists in autopostvn_users
    console.log('\n🔄 Checking autopostvn_users...');
    const appUserResult = await client.query(
      'SELECT id, email, full_name, user_role FROM autopostvn_users WHERE id = $1',
      [nextAuthUser.id]
    );

    if (appUserResult.rows.length > 0) {
      console.log('✅ User already synced to autopostvn_users');
      const appUser = appUserResult.rows[0];
      console.log(`   Role: ${appUser.user_role}`);
      console.log(`   Full Name: ${appUser.full_name}`);
    } else {
      console.log('⚠️  User NOT in autopostvn_users table');
      console.log('💡 Syncing user to autopostvn_users...');

      // 3. Sync user to autopostvn_users
      const syncResult = await client.query(
        `INSERT INTO autopostvn_users (id, email, full_name, avatar_url, user_role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, email, full_name, user_role`,
        [
          nextAuthUser.id,
          nextAuthUser.email,
          nextAuthUser.name,
          nextAuthUser.image,
          'free', // Default role
          true
        ]
      );

      console.log('✅ User synced successfully!');
      console.log(`   ID: ${syncResult.rows[0].id}`);
      console.log(`   Email: ${syncResult.rows[0].email}`);
      console.log(`   Name: ${syncResult.rows[0].full_name}`);
      console.log(`   Role: ${syncResult.rows[0].user_role}`);
    }

    // 4. Check workspace
    console.log('\n📁 Checking workspace...');
    const workspaceResult = await client.query(
      'SELECT id, name, slug FROM autopostvn_workspaces WHERE user_id = $1',
      [nextAuthUser.id]
    );

    if (workspaceResult.rows.length === 0) {
      console.log('⚠️  No workspace found');
      console.log('💡 Creating default workspace...');

      const newWorkspace = await client.query(
        `INSERT INTO autopostvn_workspaces (user_id, name, slug, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id, name, slug`,
        [
          nextAuthUser.id,
          `${nextAuthUser.name || nextAuthUser.email}'s Workspace`,
          `workspace-${nextAuthUser.id.substring(0, 8)}`
        ]
      );

      console.log('✅ Workspace created:');
      console.log(`   ID: ${newWorkspace.rows[0].id}`);
      console.log(`   Name: ${newWorkspace.rows[0].name}`);
      console.log(`   Slug: ${newWorkspace.rows[0].slug}`);
    } else {
      console.log('✅ Workspace found:');
      for (const ws of workspaceResult.rows) {
        console.log(`   • ${ws.name} (${ws.id})`);
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ User is ready to use the app!');
    console.log(`\n📋 User ID: ${nextAuthUser.id}`);
    console.log('   Copy this ID to use with other scripts\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/find-user.js <email>');
  console.log('\nExample:');
  console.log('  node scripts/find-user.js user@example.com');
  process.exit(1);
}

findAndSyncUser(email).catch(console.error);

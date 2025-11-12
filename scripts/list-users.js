/**
 * Script to list all users in the database
 * Run: node scripts/list-users.js
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

async function listUsers() {
  const client = await pool.connect();
  
  try {
    console.log('\n👥 Listing all users...');
    console.log('═'.repeat(80));

    // 1. List NextAuth users
    console.log('\n📧 NextAuth Users (User table):');
    const nextAuthUsers = await client.query(
      'SELECT id, name, email, "emailVerified", image FROM "User" ORDER BY id'
    );

    if (nextAuthUsers.rows.length === 0) {
      console.log('   No users found');
    } else {
      for (const user of nextAuthUsers.rows) {
        console.log(`\n   ✉️  ${user.email}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Name: ${user.name || 'N/A'}`);
        console.log(`      Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      }
    }

    // 2. List autopostvn_users
    console.log('\n\n📊 App Users (autopostvn_users table):');
    const appUsers = await client.query(
      'SELECT id, email, full_name, user_role, is_active FROM autopostvn_users ORDER BY created_at DESC'
    );

    if (appUsers.rows.length === 0) {
      console.log('   No users found');
    } else {
      for (const user of appUsers.rows) {
        const status = user.is_active ? '✅' : '❌';
        console.log(`\n   ${status} ${user.email}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Name: ${user.full_name || 'N/A'}`);
        console.log(`      Role: ${user.user_role}`);
      }
    }

    // 3. Check sync status
    console.log('\n\n🔄 Sync Status:');
    const syncCheck = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        CASE WHEN au.id IS NOT NULL THEN 'Synced' ELSE 'Not Synced' END as sync_status
      FROM "User" u
      LEFT JOIN autopostvn_users au ON au.id = u.id
      ORDER BY u.id
    `);

    for (const row of syncCheck.rows) {
      const icon = row.sync_status === 'Synced' ? '✅' : '⚠️';
      console.log(`   ${icon} ${row.email} - ${row.sync_status}`);
      if (row.sync_status === 'Not Synced') {
        console.log(`      💡 Run: node scripts/find-user.js ${row.email}`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   NextAuth Users: ${nextAuthUsers.rows.length}`);
    console.log(`   App Users: ${appUsers.rows.length}`);
    console.log(`   Not Synced: ${syncCheck.rows.filter(r => r.sync_status === 'Not Synced').length}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

listUsers().catch(console.error);

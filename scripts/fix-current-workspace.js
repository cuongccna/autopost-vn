/**
 * Fix current user's workspace - add missing user_id
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

async function fixCurrentWorkspace() {
  const client = await pool.connect();
  
  try {
    const USER_ID = '6b02ec4d-e0de-4834-a48f-84999e696891';
    const WORKSPACE_ID = '486fdee4-7b40-453d-bb69-681b9f3f58f8';

    console.log('\n🔧 Fixing Current Workspace\n');
    console.log('═'.repeat(80));

    // Update workspace with user_id
    console.log(`\n1️⃣  Setting user_id for workspace ${WORKSPACE_ID}...`);
    
    const result = await client.query(`
      UPDATE autopostvn_workspaces
      SET user_id = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, slug, user_id
    `, [USER_ID, WORKSPACE_ID]);

    if (result.rowCount > 0) {
      console.log('   ✅ Workspace updated:');
      console.log(`      Name: ${result.rows[0].name}`);
      console.log(`      Slug: ${result.rows[0].slug}`);
      console.log(`      User ID: ${result.rows[0].user_id}`);
    } else {
      console.log('   ⚠️  Workspace not found');
    }

    // Verify
    console.log('\n2️⃣  Verification:');
    const verify = await client.query(`
      SELECT 
        w.id,
        w.name,
        w.slug,
        w.user_id,
        u.email,
        (SELECT COUNT(*) FROM autopostvn_posts WHERE workspace_id = w.id) as post_count,
        (SELECT COUNT(*) FROM autopostvn_social_accounts WHERE workspace_id = w.id) as account_count
      FROM autopostvn_workspaces w
      LEFT JOIN autopostvn_users u ON u.id = w.user_id
      WHERE w.id = $1
    `, [WORKSPACE_ID]);

    if (verify.rows.length > 0) {
      const ws = verify.rows[0];
      console.log(`\n   ✅ Workspace: ${ws.name}`);
      console.log(`      User: ${ws.email} (${ws.user_id})`);
      console.log(`      Posts: ${ws.post_count}`);
      console.log(`      Social Accounts: ${ws.account_count}`);
    }

    // Check all workspaces for this user
    console.log('\n3️⃣  All workspaces for this user:');
    const userWorkspaces = await client.query(`
      SELECT id, name, slug
      FROM autopostvn_workspaces
      WHERE user_id = $1
    `, [USER_ID]);

    if (userWorkspaces.rows.length === 0) {
      console.log('   ⚠️  No workspaces found for this user');
    } else {
      console.log(`   Found ${userWorkspaces.rows.length} workspace(s):\n`);
      for (const ws of userWorkspaces.rows) {
        console.log(`   • ${ws.name} (${ws.id})`);
        console.log(`     Slug: ${ws.slug}`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Fix complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixCurrentWorkspace().catch(console.error);

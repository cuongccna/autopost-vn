/**
 * Fix posts: Update workspace_id and user_id
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

async function fixPosts() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔧 Fixing Posts Data\n');
    console.log('═'.repeat(80));

    // The correct IDs:
    const REAL_USER_ID = '6b02ec4d-e0de-4834-a48f-84999e696891';
    const REAL_WORKSPACE_ID = '486fdee4-7b40-453d-bb69-681b9f3f58f8';

    // 1. Check current state
    console.log('\n1️⃣  Current posts state:');
    const currentPosts = await client.query(`
      SELECT id, user_id, workspace_id, title, status
      FROM autopostvn_posts
      ORDER BY created_at DESC
    `);

    for (const post of currentPosts.rows) {
      console.log(`\n   Post: ${post.title?.substring(0, 50)}`);
      console.log(`   ID: ${post.id}`);
      console.log(`   User ID: ${post.user_id}`);
      console.log(`   Workspace ID: ${post.workspace_id || 'NULL ❌'}`);
      console.log(`   Status: ${post.status}`);
    }

    // 2. Fix all posts
    console.log('\n\n2️⃣  Fixing posts...');
    const updateResult = await client.query(`
      UPDATE autopostvn_posts
      SET 
        user_id = $1,
        workspace_id = $2,
        updated_at = NOW()
      WHERE workspace_id IS NULL OR user_id != $1
      RETURNING id, title
    `, [REAL_USER_ID, REAL_WORKSPACE_ID]);

    console.log(`\n   ✅ Updated ${updateResult.rowCount} posts`);
    for (const post of updateResult.rows) {
      console.log(`      • ${post.title?.substring(0, 50)}`);
    }

    // 3. Verify
    console.log('\n\n3️⃣  Verifying fix:');
    const verifyPosts = await client.query(`
      SELECT 
        p.id,
        p.user_id,
        p.workspace_id,
        p.title,
        p.status,
        w.name as workspace_name,
        u.email as user_email
      FROM autopostvn_posts p
      LEFT JOIN autopostvn_workspaces w ON w.id = p.workspace_id
      LEFT JOIN autopostvn_users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
    `);

    for (const post of verifyPosts.rows) {
      console.log(`\n   ✅ Post: ${post.title?.substring(0, 50)}`);
      console.log(`      User: ${post.user_email} (${post.user_id})`);
      console.log(`      Workspace: ${post.workspace_name} (${post.workspace_id})`);
      console.log(`      Status: ${post.status}`);
    }

    // 4. Check social accounts for this workspace
    console.log('\n\n4️⃣  Checking social accounts for workspace:');
    const accounts = await client.query(`
      SELECT id, provider, platform_name, is_active
      FROM autopostvn_social_accounts
      WHERE workspace_id = $1
    `, [REAL_WORKSPACE_ID]);

    if (accounts.rows.length === 0) {
      console.log(`   ⚠️  No social accounts found for workspace ${REAL_WORKSPACE_ID}`);
      console.log('   This is why posts are not loading!');
      console.log('   You need to connect social accounts first.');
    } else {
      console.log(`   ✅ Found ${accounts.rows.length} social accounts:`);
      for (const account of accounts.rows) {
        console.log(`      • ${account.platform_name || account.provider} (${account.is_active ? 'Active' : 'Inactive'})`);
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

fixPosts().catch(console.error);

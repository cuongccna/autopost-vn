/**
 * Comprehensive check for all workspace-related issues
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

async function comprehensiveCheck() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 COMPREHENSIVE WORKSPACE CHECK\n');
    console.log('═'.repeat(80));

    // 1. Check all users
    console.log('\n1️⃣  USERS:');
    const users = await client.query('SELECT id, email, full_name, user_role FROM autopostvn_users ORDER BY created_at');
    
    for (const user of users.rows) {
      console.log(`\n   👤 ${user.email}`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Name: ${user.full_name || 'N/A'}`);
      console.log(`      Role: ${user.user_role}`);

      // Check workspace for this user
      const workspaces = await client.query(
        'SELECT id, name, slug FROM autopostvn_workspaces WHERE user_id = $1',
        [user.id]
      );

      if (workspaces.rows.length === 0) {
        console.log(`      ⚠️  NO WORKSPACE - User needs to login to auto-create`);
      } else {
        for (const ws of workspaces.rows) {
          console.log(`      ✅ Workspace: ${ws.name} (${ws.id})`);
          
          // Check posts
          const posts = await client.query(
            'SELECT COUNT(*) as count FROM autopostvn_posts WHERE workspace_id = $1 AND user_id = $2',
            [ws.id, user.id]
          );
          
          // Check social accounts
          const accounts = await client.query(
            'SELECT COUNT(*) as count FROM autopostvn_social_accounts WHERE workspace_id = $1',
            [ws.id]
          );
          
          console.log(`         Posts: ${posts.rows[0].count} | Accounts: ${accounts.rows[0].count}`);
        }
      }
    }

    // 2. Check orphan workspaces (without user_id)
    console.log('\n\n2️⃣  ORPHAN WORKSPACES (no user_id):');
    const orphans = await client.query(`
      SELECT id, name, slug, 
        (SELECT COUNT(*) FROM autopostvn_posts WHERE workspace_id = w.id) as post_count,
        (SELECT COUNT(*) FROM autopostvn_social_accounts WHERE workspace_id = w.id) as account_count
      FROM autopostvn_workspaces w
      WHERE user_id IS NULL
    `);

    if (orphans.rows.length === 0) {
      console.log('   ✅ No orphan workspaces');
    } else {
      for (const ws of orphans.rows) {
        console.log(`\n   ⚠️  ${ws.name} (${ws.id})`);
        console.log(`      Slug: ${ws.slug}`);
        console.log(`      Posts: ${ws.post_count} | Accounts: ${ws.account_count}`);
        console.log(`      💡 This is likely a demo/system workspace`);
      }
    }

    // 3. Check data integrity
    console.log('\n\n3️⃣  DATA INTEGRITY CHECKS:');
    
    // Posts without workspace
    const postsNoWorkspace = await client.query(`
      SELECT COUNT(*) as count FROM autopostvn_posts WHERE workspace_id IS NULL
    `);
    console.log(`   Posts without workspace: ${postsNoWorkspace.rows[0].count} ${postsNoWorkspace.rows[0].count > 0 ? '❌' : '✅'}`);

    // Posts without user
    const postsNoUser = await client.query(`
      SELECT COUNT(*) as count FROM autopostvn_posts WHERE user_id IS NULL
    `);
    console.log(`   Posts without user: ${postsNoUser.rows[0].count} ${postsNoUser.rows[0].count > 0 ? '❌' : '✅'}`);

    // Posts with mismatched user/workspace
    const postsMismatch = await client.query(`
      SELECT COUNT(*) as count 
      FROM autopostvn_posts p
      JOIN autopostvn_workspaces w ON w.id = p.workspace_id
      WHERE p.user_id != w.user_id AND w.user_id IS NOT NULL
    `);
    console.log(`   Posts with mismatched user/workspace: ${postsMismatch.rows[0].count} ${postsMismatch.rows[0].count > 0 ? '❌' : '✅'}`);

    // Schedules without social account
    const schedulesNoAccount = await client.query(`
      SELECT COUNT(*) as count FROM autopostvn_post_schedules WHERE social_account_id IS NULL
    `);
    console.log(`   Schedules without social account: ${schedulesNoAccount.rows[0].count} ${schedulesNoAccount.rows[0].count > 0 ? '❌' : '✅'}`);

    // 4. List all workspace-user mappings
    console.log('\n\n4️⃣  WORKSPACE ↔ USER MAPPINGS:');
    const mappings = await client.query(`
      SELECT 
        w.id as workspace_id,
        w.name as workspace_name,
        w.user_id,
        u.email,
        (SELECT COUNT(*) FROM autopostvn_posts WHERE workspace_id = w.id) as posts,
        (SELECT COUNT(*) FROM autopostvn_social_accounts WHERE workspace_id = w.id) as accounts
      FROM autopostvn_workspaces w
      LEFT JOIN autopostvn_users u ON u.id = w.user_id
      ORDER BY w.created_at DESC
    `);

    for (const map of mappings.rows) {
      const userStatus = map.user_id ? '✅' : '⚠️';
      console.log(`\n   ${userStatus} ${map.workspace_name}`);
      console.log(`      Workspace ID: ${map.workspace_id}`);
      console.log(`      User: ${map.email || 'NONE (System workspace)'}`);
      console.log(`      User ID: ${map.user_id || 'NULL'}`);
      console.log(`      Resources: ${map.posts} posts, ${map.accounts} accounts`);
    }

    // 5. Summary
    console.log('\n\n5️⃣  SUMMARY:');
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM autopostvn_users) as total_users,
        (SELECT COUNT(*) FROM autopostvn_workspaces) as total_workspaces,
        (SELECT COUNT(*) FROM autopostvn_workspaces WHERE user_id IS NOT NULL) as workspaces_with_user,
        (SELECT COUNT(*) FROM autopostvn_posts) as total_posts,
        (SELECT COUNT(*) FROM autopostvn_social_accounts) as total_accounts,
        (SELECT COUNT(*) FROM autopostvn_post_schedules) as total_schedules
    `);

    const s = summary.rows[0];
    console.log(`\n   Users: ${s.total_users}`);
    console.log(`   Workspaces: ${s.total_workspaces} (${s.workspaces_with_user} with user_id)`);
    console.log(`   Posts: ${s.total_posts}`);
    console.log(`   Social Accounts: ${s.total_accounts}`);
    console.log(`   Post Schedules: ${s.total_schedules}`);

    // 6. Action items
    console.log('\n\n6️⃣  ACTION ITEMS:');
    
    if (parseInt(postsNoWorkspace.rows[0].count) > 0) {
      console.log('   ❌ Fix posts without workspace_id');
    }
    
    if (parseInt(postsNoUser.rows[0].count) > 0) {
      console.log('   ❌ Fix posts without user_id');
    }
    
    if (parseInt(postsMismatch.rows[0].count) > 0) {
      console.log('   ❌ Fix posts with mismatched user/workspace');
    }
    
    if (parseInt(orphans.rows.length) > 0 && orphans.rows.some(w => w.post_count > 0)) {
      console.log('   ⚠️  Assign user_id to orphan workspaces with data');
    }

    const usersWithoutWorkspace = users.rows.filter(user => {
      const ws = mappings.rows.find(m => m.user_id === user.id);
      return !ws;
    });

    if (usersWithoutWorkspace.length > 0) {
      console.log(`   ⚠️  ${usersWithoutWorkspace.length} user(s) need to login to create workspace`);
    }

    if (
      parseInt(postsNoWorkspace.rows[0].count) === 0 &&
      parseInt(postsNoUser.rows[0].count) === 0 &&
      parseInt(postsMismatch.rows[0].count) === 0 &&
      usersWithoutWorkspace.length === 0
    ) {
      console.log('   ✅ All data integrity checks passed!');
      console.log('   💡 Users should LOGOUT & LOGIN to get fresh session');
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Check complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

comprehensiveCheck().catch(console.error);

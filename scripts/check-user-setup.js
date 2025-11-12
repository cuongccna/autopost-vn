/**
 * Script to check and setup user workspace and social accounts
 * Run: node scripts/check-user-setup.js <user_id>
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

async function checkUserSetup(userId) {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 Checking setup for user:', userId);
    console.log('═'.repeat(60));

    // 1. Check user exists
    const userResult = await client.query(
      'SELECT id, email, full_name, user_role FROM autopostvn_users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }

    const user = userResult.rows[0];
    console.log('\n✅ User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.full_name || 'N/A'}`);
    console.log(`   Role: ${user.user_role}`);

    // 2. Check workspaces
    const workspaceResult = await client.query(
      'SELECT id, name, slug FROM autopostvn_workspaces WHERE user_id = $1',
      [userId]
    );

    console.log(`\n📁 Workspaces: ${workspaceResult.rows.length}`);
    if (workspaceResult.rows.length === 0) {
      console.log('   ⚠️  No workspace found!');
      console.log('   Creating default workspace...');
      
      const newWorkspace = await client.query(
        `INSERT INTO autopostvn_workspaces (user_id, name, slug, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id, name, slug`,
        [userId, `${user.full_name || user.email}'s Workspace`, `workspace-${userId.substring(0, 8)}`]
      );

      console.log('   ✅ Created workspace:', newWorkspace.rows[0].name);
      workspaceResult.rows.push(newWorkspace.rows[0]);
    }

    for (const ws of workspaceResult.rows) {
      console.log(`   ✅ ${ws.name} (${ws.id})`);
    }

    // 3. Check social accounts for each workspace
    for (const ws of workspaceResult.rows) {
      console.log(`\n🔗 Social Accounts for "${ws.name}":`);
      
      const accountsResult = await client.query(
        `SELECT id, provider, platform_name, is_active 
         FROM autopostvn_social_accounts 
         WHERE workspace_id = $1`,
        [ws.id]
      );

      if (accountsResult.rows.length === 0) {
        console.log('   ⚠️  No social accounts connected!');
        console.log('   💡 You need to connect at least one social account to create posts.');
        console.log('   Go to: Settings → Social Accounts → Connect Account');
      } else {
        for (const account of accountsResult.rows) {
          const status = account.is_active ? '✅' : '❌';
          console.log(`   ${status} ${account.platform_name || account.provider} (${account.id})`);
        }
      }
    }

    // 4. Check recent posts
    console.log('\n📝 Recent Posts:');
    const postsResult = await client.query(
      `SELECT id, title, status, workspace_id, scheduled_at, created_at
       FROM autopostvn_posts 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );

    if (postsResult.rows.length === 0) {
      console.log('   No posts yet');
    } else {
      for (const post of postsResult.rows) {
        const workspace = workspaceResult.rows.find(w => w.id === post.workspace_id);
        console.log(`   • ${post.title.substring(0, 40)}...`);
        console.log(`     Status: ${post.status} | Workspace: ${workspace?.name || 'Unknown'}`);
        console.log(`     Created: ${post.created_at}`);
        
        // Check schedules for this post
        const schedulesResult = await client.query(
          `SELECT ps.id, ps.status, ps.scheduled_at, sa.platform_name, sa.provider
           FROM autopostvn_post_schedules ps
           LEFT JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
           WHERE ps.post_id = $1`,
          [post.id]
        );

        if (schedulesResult.rows.length > 0) {
          console.log('     Schedules:');
          for (const schedule of schedulesResult.rows) {
            console.log(`       - ${schedule.platform_name || schedule.provider}: ${schedule.status} @ ${schedule.scheduled_at || 'N/A'}`);
          }
        } else {
          console.log('     ⚠️  No schedules found (this is why it\'s not loading!)');
        }
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Setup check complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Get user ID from command line
const userId = process.argv[2];

if (!userId) {
  console.log('Usage: node scripts/check-user-setup.js <user_id>');
  console.log('\nExample:');
  console.log('  node scripts/check-user-setup.js 486fdee4-7b40-453d-bb69-681b9f3f58f8');
  process.exit(1);
}

checkUserSetup(userId).catch(console.error);

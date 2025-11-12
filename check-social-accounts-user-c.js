const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'autopost_vn',
  user: 'autopost_admin',
  password: 'autopost_vn_secure_2025'
});

async function checkSocialAccounts() {
  try {
    const userId = 'cce57fee-a743-4ff6-9c90-e4953f43be26'; // c@gmail.com
    
    console.log(`🔍 Checking social accounts for user: ${userId}\n`);
    
    // Check social accounts
    const accounts = await pool.query(`
      SELECT id, provider, provider_id, name, status, created_at
      FROM autopostvn_social_accounts
      WHERE workspace_id IN (
        SELECT id FROM autopostvn_workspaces WHERE user_id = $1
      )
      ORDER BY created_at DESC
    `, [userId]);
    
    console.log(`📊 Found ${accounts.rows.length} social account(s):\n`);
    
    if (accounts.rows.length === 0) {
      console.log('❌ No social accounts found!');
      console.log('\nPossible reasons:');
      console.log('1. Accounts linked to different workspace_id');
      console.log('2. Accounts linked directly to user_id (old schema)');
      console.log('3. OAuth connection failed\n');
      
      // Check if accounts linked to user_id instead of workspace_id
      console.log('🔍 Checking accounts linked to user_id...\n');
      const directAccounts = await pool.query(`
        SELECT id, provider, provider_id, name, status, workspace_id
        FROM autopostvn_social_accounts
        WHERE id = $1 OR provider_id LIKE '%' || $1 || '%'
      `, [userId]);
      
      if (directAccounts.rows.length > 0) {
        console.log(`⚠️ Found ${directAccounts.rows.length} account(s) with different linking:\n`);
        directAccounts.rows.forEach(acc => {
          console.log(`   - ${acc.name} (${acc.provider})`);
          console.log(`     workspace_id: ${acc.workspace_id || 'NULL'}`);
          console.log('');
        });
      }
    } else {
      accounts.rows.forEach((acc, i) => {
        console.log(`${i + 1}. ${acc.name}`);
        console.log(`   Provider: ${acc.provider}`);
        console.log(`   Provider ID: ${acc.provider_id}`);
        console.log(`   Status: ${acc.status}`);
        console.log(`   Created: ${acc.created_at}`);
        console.log('');
      });
    }
    
    // Check workspace
    console.log('🏢 Checking workspace...\n');
    const workspace = await pool.query(`
      SELECT id, name, slug, user_id
      FROM autopostvn_workspaces
      WHERE user_id = $1
    `, [userId]);
    
    if (workspace.rows.length === 0) {
      console.log('❌ No workspace found for this user!');
    } else {
      workspace.rows.forEach(ws => {
        console.log(`✅ Workspace: ${ws.name}`);
        console.log(`   ID: ${ws.id}`);
        console.log(`   Slug: ${ws.slug}`);
        console.log(`   User ID: ${ws.user_id}`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkSocialAccounts();

/**
 * Run workspace migration - Add user_id column
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE || 'autopost_vn',
  user: process.env.POSTGRES_USER || 'autopost_admin',
  password: process.env.POSTGRES_PASSWORD || 'autopost_vn_secure_2025',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔄 Running Workspace Migration\n');
    console.log('═'.repeat(80));

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add_user_id_to_workspaces.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n1️⃣  Executing migration SQL...\n');

    // Execute migration
    await client.query(migrationSQL);

    console.log('\n✅ Migration completed successfully!\n');

    // Verify results
    console.log('2️⃣  Verification:\n');

    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_workspaces,
        COUNT(user_id) as workspaces_with_user,
        COUNT(*) - COUNT(user_id) as orphan_workspaces
      FROM autopostvn_workspaces
    `);

    console.log(`   Total workspaces: ${stats.rows[0].total_workspaces}`);
    console.log(`   With user_id: ${stats.rows[0].workspaces_with_user}`);
    console.log(`   Without user_id: ${stats.rows[0].orphan_workspaces}`);

    // Show workspace details
    console.log('\n3️⃣  Workspace details:\n');
    const workspaces = await client.query(`
      SELECT 
        w.id,
        w.name,
        w.slug,
        w.user_id,
        u.email as user_email,
        (SELECT COUNT(*) FROM autopostvn_posts WHERE workspace_id = w.id) as post_count,
        (SELECT COUNT(*) FROM autopostvn_social_accounts WHERE workspace_id = w.id) as account_count
      FROM autopostvn_workspaces w
      LEFT JOIN autopostvn_users u ON u.id = w.user_id
      ORDER BY w.created_at DESC
    `);

    for (const ws of workspaces.rows) {
      const hasUser = ws.user_id ? '✅' : '⚠️';
      console.log(`   ${hasUser} ${ws.name}`);
      console.log(`      ID: ${ws.id}`);
      console.log(`      Slug: ${ws.slug}`);
      console.log(`      User: ${ws.user_email || 'NONE (System/Demo workspace)'}`);
      console.log(`      Posts: ${ws.post_count} | Accounts: ${ws.account_count}`);
      console.log('');
    }

    console.log('═'.repeat(80));
    console.log('\n✅ Migration complete!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

/**
 * Check social accounts for a workspace
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

async function checkSocialAccounts() {
  const client = await pool.connect();
  
  try {
    const WORKSPACE_ID = '486fdee4-7b40-453d-bb69-681b9f3f58f8';

    console.log('\n🔗 Social Accounts Check\n');
    console.log('═'.repeat(80));
    console.log(`Workspace ID: ${WORKSPACE_ID}\n`);

    // Check table structure
    console.log('1️⃣  Table structure:');
    const columns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'autopostvn_social_accounts'
      ORDER BY ordinal_position
    `);

    for (const col of columns.rows) {
      console.log(`   • ${col.column_name}: ${col.data_type}`);
    }

    // Check accounts for this workspace
    console.log('\n\n2️⃣  Social accounts for this workspace:');
    const accounts = await client.query(`
      SELECT *
      FROM autopostvn_social_accounts
      WHERE workspace_id = $1
    `, [WORKSPACE_ID]);

    if (accounts.rows.length === 0) {
      console.log('   ❌ No social accounts found!');
      console.log('\n   💡 This is why posts are not showing!');
      console.log('   To fix: Go to app → Settings → Connect Social Accounts');
    } else {
      console.log(`   ✅ Found ${accounts.rows.length} account(s):\n`);
      for (const account of accounts.rows) {
        console.log(`   Account ID: ${account.id}`);
        console.log(`   Provider: ${account.provider}`);
        console.log(`   Platform Name: ${account.platform_name || 'N/A'}`);
        console.log(`   Status: ${account.status || 'N/A'}`);
        console.log('');
      }
    }

    // Check ALL social accounts in database
    console.log('\n3️⃣  All social accounts in database:');
    const allAccounts = await client.query(`
      SELECT 
        sa.*,
        w.name as workspace_name
      FROM autopostvn_social_accounts sa
      LEFT JOIN autopostvn_workspaces w ON w.id = sa.workspace_id
      ORDER BY sa.created_at DESC
      LIMIT 10
    `);

    if (allAccounts.rows.length === 0) {
      console.log('   No social accounts in entire database');
    } else {
      console.log(`   Total: ${allAccounts.rows.length} accounts\n`);
      for (const account of allAccounts.rows) {
        console.log(`   • ${account.platform_name || account.provider}`);
        console.log(`     Workspace: ${account.workspace_name || 'Unknown'} (${account.workspace_id})`);
        console.log(`     Provider: ${account.provider}`);
        console.log('');
      }
    }

    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSocialAccounts().catch(console.error);

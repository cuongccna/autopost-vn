/**
 * Check workspace tables structure and data
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

async function checkWorkspaces() {
  const client = await pool.connect();
  
  try {
    console.log('\n📁 Workspace Tables Analysis\n');
    console.log('═'.repeat(80));

    // 1. Check autopostvn_workspaces structure
    console.log('\n1️⃣  autopostvn_workspaces structure:');
    const wsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'autopostvn_workspaces'
      ORDER BY ordinal_position
    `);
    
    for (const col of wsColumns.rows) {
      console.log(`   • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    }

    const wsCount = await client.query('SELECT COUNT(*) FROM autopostvn_workspaces');
    console.log(`\n   Total rows: ${wsCount.rows[0].count}`);

    if (parseInt(wsCount.rows[0].count) > 0) {
      const wsData = await client.query('SELECT * FROM autopostvn_workspaces LIMIT 5');
      console.log('\n   Sample data:');
      for (const row of wsData.rows) {
        console.log(`   • ${row.name} (${row.id})`);
        console.log(`     Slug: ${row.slug}`);
      }
    }

    // 2. Check autopostvn_user_workspaces structure
    console.log('\n\n2️⃣  autopostvn_user_workspaces structure:');
    const uwsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'autopostvn_user_workspaces'
      ORDER BY ordinal_position
    `);
    
    for (const col of uwsColumns.rows) {
      console.log(`   • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    }

    const uwsCount = await client.query('SELECT COUNT(*) FROM autopostvn_user_workspaces');
    console.log(`\n   Total rows: ${uwsCount.rows[0].count}`);

    if (parseInt(uwsCount.rows[0].count) > 0) {
      const uwsData = await client.query('SELECT * FROM autopostvn_user_workspaces LIMIT 5');
      console.log('\n   Sample data:');
      for (const row of uwsData.rows) {
        console.log(`   • ${row.workspace_name} for ${row.user_email}`);
        console.log(`     ID: ${row.id}`);
      }
    }

    // 3. Check posts and their workspace_id
    console.log('\n\n3️⃣  Posts with workspace_id:');
    const postsWithWS = await client.query(`
      SELECT 
        p.id,
        p.workspace_id,
        p.user_id,
        p.title,
        w.name as workspace_name
      FROM autopostvn_posts p
      LEFT JOIN autopostvn_workspaces w ON w.id = p.workspace_id
      LIMIT 5
    `);

    if (postsWithWS.rows.length === 0) {
      console.log('   No posts found');
    } else {
      for (const post of postsWithWS.rows) {
        console.log(`   • Post: ${post.title?.substring(0, 40)}...`);
        console.log(`     Post ID: ${post.id}`);
        console.log(`     User ID: ${post.user_id}`);
        console.log(`     Workspace ID: ${post.workspace_id || 'NULL ❌'}`);
        console.log(`     Workspace Name: ${post.workspace_name || 'Not Found'}`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   autopostvn_workspaces: ${wsCount.rows[0].count} rows`);
    console.log(`   autopostvn_user_workspaces: ${uwsCount.rows[0].count} rows`);
    console.log(`   autopostvn_posts: ${postsWithWS.rows.length} rows shown\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkWorkspaces().catch(console.error);

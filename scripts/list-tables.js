/**
 * Script to list all tables in the database
 * Run: node scripts/list-tables.js
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

async function listTables() {
  const client = await pool.connect();
  
  try {
    console.log('\n📊 Database Tables:');
    console.log('═'.repeat(80));

    const result = await client.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, tablename
    `);

    let currentSchema = '';
    for (const table of result.rows) {
      if (table.schemaname !== currentSchema) {
        currentSchema = table.schemaname;
        console.log(`\n📁 Schema: ${currentSchema}`);
      }
      console.log(`   • ${table.tablename} (${table.size})`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`Total tables: ${result.rows.length}\n`);

    // Check for user-related tables
    console.log('\n👤 User-related tables:');
    const userTables = result.rows.filter(t => 
      t.tablename.toLowerCase().includes('user') || 
      t.tablename.toLowerCase().includes('auth')
    );
    
    for (const table of userTables) {
      console.log(`   ✓ ${table.schemaname}.${table.tablename}`);
      
      // Get row count
      try {
        const countResult = await client.query(
          `SELECT COUNT(*) as count FROM ${table.schemaname}.${table.tablename}`
        );
        console.log(`     Rows: ${countResult.rows[0].count}`);
      } catch (e) {
        console.log(`     Rows: Error reading`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

listTables().catch(console.error);

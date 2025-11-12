/**
 * Simple script to show all users
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

async function showUsers() {
  const client = await pool.connect();
  
  try {
    console.log('\n👥 All Users in autopostvn_users:\n');
    
    const result = await client.query(
      'SELECT id, email, full_name, user_role, is_active, created_at FROM autopostvn_users ORDER BY created_at DESC'
    );

    for (const user of result.rows) {
      console.log('═'.repeat(80));
      console.log(`📧 Email: ${user.email}`);
      console.log(`🆔 ID: ${user.id}`);
      console.log(`👤 Name: ${user.full_name || 'N/A'}`);
      console.log(`🎭 Role: ${user.user_role}`);
      console.log(`✅ Active: ${user.is_active}`);
      console.log(`📅 Created: ${user.created_at}`);
      console.log('');
    }

    console.log('═'.repeat(80));
    console.log(`Total: ${result.rows.length} user(s)\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

showUsers().catch(console.error);

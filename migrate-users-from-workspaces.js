const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'autopost_vn',
  user: 'autopost_admin',
  password: 'autopost_vn_secure_2025'
});

async function migrateUser() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔄 Migrating user from workspaces to users table...\n');
    
    // Find all workspaces with user data in settings
    const workspaces = await client.query(`
      SELECT id, name, slug, settings
      FROM autopostvn_workspaces
      WHERE settings->>'user_email' IS NOT NULL
      AND settings->>'password_hash' IS NOT NULL
    `);
    
    console.log(`📋 Found ${workspaces.rows.length} workspace(s) to migrate:\n`);
    
    for (const workspace of workspaces.rows) {
      const settings = workspace.settings;
      const email = settings.user_email;
      const password_hash = settings.password_hash;
      const full_name = settings.user_full_name || email.split('@')[0];
      
      console.log(`👤 Migrating: ${email}`);
      
      // Check if user already exists
      const existing = await client.query(
        'SELECT id FROM autopostvn_users WHERE email = $1',
        [email]
      );
      
      if (existing.rows.length > 0) {
        console.log(`   ⚠️  Already exists in users table, skipping\n`);
        continue;
      }
      
      // Insert into users table
      await client.query(`
        INSERT INTO autopostvn_users (
          id, email, full_name, password_hash, user_role, 
          is_active, email_verified, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        workspace.id,  // Use same ID as workspace
        email,
        full_name,
        password_hash,
        'free',  // Default role
        true,
        settings.email_verified || false,
        settings.created_at || new Date(),
        new Date()
      ]);
      
      console.log(`   ✅ Created user in autopostvn_users`);
      
      // Update workspace to link to user
      await client.query(`
        UPDATE autopostvn_workspaces
        SET user_id = $1,
            settings = $2::jsonb,
            updated_at = NOW()
        WHERE id = $1
      `, [
        workspace.id,
        JSON.stringify({})  // Clear old settings
      ]);
      
      console.log(`   ✅ Updated workspace to link to user\n`);
    }
    
    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateUser();

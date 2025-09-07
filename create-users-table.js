const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fmvxmvahknbzzjzhofql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdnhtdmFoa25ienpqemhvZnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxNzM4NSwiZXhwIjoyMDcxMTkzMzg1fQ.4QdCKgptvWzLEKgAxgLbvfORLLwzu8aXUzTYp1fw_oo'
);

async function createUsersTable() {
  try {
    console.log('🔧 Creating users table and populating from auth.users...');
    
    // Get all auth users
    const { data: authData } = await supabase.auth.admin.listUsers();
    
    if (!authData.users.length) {
      console.log('❌ No users found in auth.users');
      return;
    }
    
    console.log(`✅ Found ${authData.users.length} users in auth.users`);
    
    // Create users table data
    const usersToInsert = authData.users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0],
      role: user.app_metadata?.role || 'free',
      created_at: user.created_at,
      updated_at: new Date().toISOString()
    }));
    
    console.log('Users to insert:', usersToInsert);
    
    // Try to insert/upsert users
    const { data, error } = await supabase
      .from('users')
      .upsert(usersToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();
      
    if (error) {
      console.log('❌ Error inserting users (table might not exist):', error);
      
      // Try to create the table first
      console.log('🔧 Attempting to create users table...');
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          role TEXT DEFAULT 'free',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      
      // Note: Can't execute raw SQL from client, would need database access
      console.log('❌ Cannot create table via client. Please create table manually or via SQL editor:');
      console.log(createTableSQL);
      
    } else {
      console.log('✅ Users table populated successfully:', data);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createUsersTable();

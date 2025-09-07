const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fmvxmvahknbzzjzhofql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdnhtdmFoa25ienpqemhvZnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxNzM4NSwiZXhwIjoyMDcxMTkzMzg1fQ.4QdCKgptvWzLEKgAxgLbvfORLLwzu8aXUzTYp1fw_oo'
  // Removed schema config to use default 'public' schema
);

async function checkUserRole() {
  try {
    console.log('🔍 Checking database structure...');
    console.log('Supabase URL: https://fmvxmvahknbzzjzhofql.supabase.co');
    
    // First, let's see what tables exist
    console.log('\n📋 Checking user_settings table...');
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(5);
      
    if (settingsError) {
      console.log('❌ Error with user_settings:', settingsError);
    } else {
      console.log('✅ user_settings table found:', userSettings);
    }

    // Try auth.users (built-in Supabase auth table)
    console.log('\n👤 Checking auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error with auth.users:', authError);
    } else {
      console.log('✅ Auth users found:', authUsers.users.length);
      
      // Look for our user
      const targetUser = authUsers.users.find(u => u.email === 'qiangvinhhoan@gmail.com');
      if (targetUser) {
        console.log('🎯 Found target user in auth:');
        console.log('- ID:', targetUser.id);
        console.log('- Email:', targetUser.email);
        console.log('- Metadata:', targetUser.user_metadata);
        console.log('- App Metadata:', targetUser.app_metadata);
        
        // Check if user has role in app_metadata
        const currentRole = targetUser.app_metadata?.role || 'free';
        console.log('- Current Role:', currentRole);
        
        if (currentRole !== 'professional') {
          console.log('\n🔧 Updating user role to professional...');
          const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
            targetUser.id,
            {
              app_metadata: {
                ...targetUser.app_metadata,
                role: 'professional'
              }
            }
          );
          
          if (updateError) {
            console.error('❌ Error updating role:', updateError);
          } else {
            console.log('✅ Role updated successfully in auth.users');
          }
        } else {
          console.log('✅ User already has professional role');
        }
      } else {
        console.log('❌ User not found in auth.users');
      }
    }

    // Check for any custom user profile table
    console.log('\n� Checking for profiles or similar tables...');
    const possibleTables = ['profiles', 'user_profiles', 'accounts'];
    
    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (!error) {
          console.log(`✅ Found table: ${tableName}`);
          console.log('Sample data:', data);
        }
      } catch (e) {
        // Table doesn't exist, continue
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUserRole();

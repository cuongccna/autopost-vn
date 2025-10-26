const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fmvxmvahknbzzjzhofql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdnhtdmFoa25ienpqemhvZnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxNzM4NSwiZXhwIjoyMDcxMTkzMzg1fQ.4QdCKgptvWzLEKgAxgLbvfORLLwzu8aXUzTYp1fw_oo'
);

async function checkUsers() {
  console.log('🔍 Checking users in autopostvn_users table...\n');

  const { data: users, error } = await supabase
    .from('autopostvn_users')
    .select('id, email, full_name, user_role, auth_user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('⚠️ No users found in autopostvn_users table');
    console.log('\n📋 This might mean:');
    console.log('1. Users registered but not synced to autopostvn_users');
    console.log('2. Need to check auth.users table instead');
    return;
  }

  console.log(`✓ Found ${users.length} users:\n`);
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Auth User ID: ${user.auth_user_id || 'NULL'}`);
    console.log(`   - Role: ${user.user_role || 'NULL'}`);
    console.log(`   - Full Name: ${user.full_name || 'NULL'}`);
    console.log(`   - Created: ${new Date(user.created_at).toLocaleString()}`);
    console.log('');
  });

  // Check for users without auth_user_id
  const usersWithoutAuthId = users.filter(u => !u.auth_user_id);
  if (usersWithoutAuthId.length > 0) {
    console.log(`\n⚠️ ${usersWithoutAuthId.length} users missing auth_user_id:`);
    usersWithoutAuthId.forEach(u => {
      console.log(`   - ${u.email}`);
    });
    console.log('\n💡 These users need auth_user_id to be linked properly');
  }
}

checkUsers();

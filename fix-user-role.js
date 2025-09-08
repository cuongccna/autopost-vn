const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUserRole() {
  try {
    console.log('🔧 Checking and fixing user role...\n');

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('autopostvn_users')
      .select('id, email, user_role')
      .eq('email', 'qiangvinhhoan@gmail.com')
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return;
    }

    console.log(`👤 Current user data in database:`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Role: ${user.user_role}`);
    console.log(`  - ID: ${user.id}\n`);

    if (user.user_role !== 'professional') {
      console.log('🔄 Updating user role to professional...');
      
      const { data: updateResult, error: updateError } = await supabase
        .from('autopostvn_users')
        .update({ user_role: 'professional' })
        .eq('id', user.id)
        .select();

      if (updateError) {
        console.error('❌ Error updating user role:', updateError);
      } else {
        console.log('✅ User role updated successfully!');
        console.log('Updated data:', updateResult[0]);
      }
    } else {
      console.log('✅ User role is already professional');
    }

    // Check if there are any auth_users entries that need updating
    console.log('\n🔍 Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
    } else {
      const authUser = authUsers.users.find(u => u.email === 'qiangvinhhoan@gmail.com');
      if (authUser) {
        console.log(`📧 Auth user found: ${authUser.email}`);
        console.log(`🆔 Auth user ID: ${authUser.id}`);
        console.log(`📊 Auth user metadata:`, authUser.user_metadata);
        
        // Update auth user metadata if needed
        if (authUser.user_metadata?.user_role !== 'professional') {
          console.log('🔄 Updating auth user metadata...');
          
          const { data: authUpdateResult, error: authUpdateError } = await supabase.auth.admin.updateUserById(
            authUser.id,
            { 
              user_metadata: { 
                ...authUser.user_metadata,
                user_role: 'professional' 
              }
            }
          );
          
          if (authUpdateError) {
            console.error('❌ Error updating auth user:', authUpdateError);
          } else {
            console.log('✅ Auth user metadata updated!');
          }
        }
      }
    }

  } catch (error) {
    console.error('💥 Fix error:', error);
  }
}

fixUserRole();

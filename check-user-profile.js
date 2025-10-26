// Script to check user profile data in database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserProfile() {
  try {
    console.log('🔍 Checking user profiles...\n');

    // Get all users
    const { data: users, error } = await supabase
      .from('autopostvn_users')
      .select('id, email, full_name, phone, avatar_url, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`✅ Found ${users.length} users:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. User Profile:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Full Name: ${user.full_name || '(empty)'}`);
      console.log(`   Phone: ${user.phone || '(empty)'}`);
      console.log(`   Avatar: ${user.avatar_url || '(empty)'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Updated: ${user.updated_at}`);
      console.log('');
    });

    // Check if fields exist in table
    console.log('📊 Checking table structure...\n');
    const { data: columns } = await supabase
      .rpc('get_table_columns', { table_name: 'autopostvn_users' })
      .single();

    console.log('Table columns:', columns);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserProfile();

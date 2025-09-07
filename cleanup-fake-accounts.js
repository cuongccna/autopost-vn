const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const envLines = envContent.split('\n');
const env = {};
envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupFakeAccounts() {
  try {
    console.log('=== Removing Fake Social Accounts ===');
    
    // List of fake accounts to remove
    const fakeAccountNames = [
      'Fanpage Cửa Hàng A',
      'Instagram Shop B', 
      'Zalo OA Dịch Vụ C',
      'Test Facebook Page',
      'Test Instagram Account'
    ];
    
    const fakeUsernames = [
      'cuahang_a',
      'shop_b_official',
      'dichvu_c_oa',
      'test_fb_page',
      'test_ig_account'
    ];
    
    // Delete by name
    const { data: deletedByName, error: nameError } = await supabase
      .from('autopostvn_social_accounts')
      .delete()
      .in('name', fakeAccountNames)
      .select();
    
    if (nameError) {
      console.error('Error deleting by name:', nameError);
    } else {
      console.log(`✅ Deleted ${deletedByName?.length || 0} accounts by name`);
    }
    
    // Delete by username
    const { data: deletedByUsername, error: usernameError } = await supabase
      .from('autopostvn_social_accounts')
      .delete()
      .in('username', fakeUsernames)
      .select();
    
    if (usernameError) {
      console.error('Error deleting by username:', usernameError);
    } else {
      console.log(`✅ Deleted ${deletedByUsername?.length || 0} accounts by username`);
    }
    
    // Delete fake workspace accounts (123e4567-e89b-12d3-a456-426614174000)
    const { data: deletedByWorkspace, error: workspaceError } = await supabase
      .from('autopostvn_social_accounts')
      .delete()
      .eq('workspace_id', '123e4567-e89b-12d3-a456-426614174000')
      .select();
    
    if (workspaceError) {
      console.error('Error deleting by workspace:', workspaceError);
    } else {
      console.log(`✅ Deleted ${deletedByWorkspace?.length || 0} accounts from fake workspace`);
    }
    
    // Clean up failed schedules
    console.log('\n=== Cleaning Failed Schedules ===');
    const { data: deletedSchedules, error: scheduleError } = await supabase
      .from('autopostvn_post_schedules')
      .delete()
      .eq('status', 'failed')
      .select();
    
    if (scheduleError) {
      console.error('Error deleting failed schedules:', scheduleError);
    } else {
      console.log(`✅ Deleted ${deletedSchedules?.length || 0} failed schedules`);
    }
    
    // Show remaining accounts
    console.log('\n=== Remaining Social Accounts ===');
    const { data: remaining, error: remainingError } = await supabase
      .from('autopostvn_social_accounts')
      .select('*');
    
    if (remainingError) {
      console.error('Error fetching remaining accounts:', remainingError);
    } else {
      console.log(`Found ${remaining?.length || 0} remaining accounts:`);
      remaining?.forEach(account => {
        console.log(`- ${account.name} (${account.provider}) - Status: ${account.status}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

cleanupFakeAccounts();

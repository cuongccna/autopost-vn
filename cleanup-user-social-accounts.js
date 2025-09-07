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

async function cleanupUserSocialAccounts() {
  try {
    console.log('=== Checking User Social Accounts Table ===');
    
    // Check current data
    const { data: accounts, error: fetchError } = await supabase
      .from('autopostvn_user_social_accounts')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching accounts:', fetchError);
      return;
    }
    
    console.log(`Found ${accounts?.length || 0} accounts in autopostvn_user_social_accounts:`);
    accounts?.forEach(account => {
      console.log(`- ${account.provider}: ${account.provider_account_name || account.provider_account_id}`);
    });
    
    // Delete all records
    if (accounts && accounts.length > 0) {
      console.log('\n=== Deleting User Social Accounts ===');
      const { data: deleted, error: deleteError } = await supabase
        .from('autopostvn_user_social_accounts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
        .select();
      
      if (deleteError) {
        console.error('Error deleting accounts:', deleteError);
      } else {
        console.log(`✅ Deleted ${deleted?.length || 0} accounts from autopostvn_user_social_accounts`);
      }
    }
    
    // Verify cleanup
    console.log('\n=== Verification ===');
    const { data: remaining, error: verifyError } = await supabase
      .from('autopostvn_user_social_accounts')
      .select('count');
    
    if (verifyError) {
      console.error('Error verifying cleanup:', verifyError);
    } else {
      console.log(`Remaining records: ${remaining?.[0]?.count || 0}`);
    }
    
    // Check main social accounts table
    const { data: mainAccounts, error: mainError } = await supabase
      .from('autopostvn_social_accounts')
      .select('*');
    
    if (mainError) {
      console.error('Error checking main accounts:', mainError);
    } else {
      console.log(`Records in autopostvn_social_accounts: ${mainAccounts?.length || 0}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

cleanupUserSocialAccounts();

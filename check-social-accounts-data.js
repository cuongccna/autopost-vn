const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('=== Checking autopostvn_social_accounts ===');
  const { data: socialAccounts, error: error1 } = await supabase
    .from('autopostvn_social_accounts')
    .select('*');
  
  if (error1) {
    console.error('Error:', error1);
  } else {
    console.log('Count:', socialAccounts?.length || 0);
    if (socialAccounts?.length > 0) {
      console.log('Data:', JSON.stringify(socialAccounts, null, 2));
    }
  }
  
  console.log('\n=== Checking autopostvn_user_social_accounts ===');
  const { data: userSocialAccounts, error: error2 } = await supabase
    .from('autopostvn_user_social_accounts')
    .select('*');
    
  if (error2) {
    console.error('Error:', error2);
  } else {
    console.log('Count:', userSocialAccounts?.length || 0);
    if (userSocialAccounts?.length > 0) {
      console.log('Data:', JSON.stringify(userSocialAccounts, null, 2));
    }
  }
}

checkTables().then(() => process.exit(0)).catch(console.error);

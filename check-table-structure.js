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

async function checkTableStructure() {
  try {
    console.log('=== Checking Social Accounts Table ===');
    
    const { data: accounts, error: accountsError } = await supabase
      .from('autopostvn_social_accounts')
      .select('*')
      .limit(3);
    
    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
    } else {
      console.log('Social accounts sample:');
      console.log(JSON.stringify(accounts, null, 2));
    }
    
    console.log('\n=== Checking Post Schedules Table Structure ===');
    
    const { data: schedules, error: schedulesError } = await supabase
      .from('autopostvn_post_schedules')
      .select('*')
      .limit(1);
    
    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
    } else {
      console.log('Post schedules sample:');
      console.log(JSON.stringify(schedules, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTableStructure();

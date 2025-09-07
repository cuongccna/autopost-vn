const { createClient } = require('@supabase/supabase-js');

// Load env variables manually 
const fs = require('fs');
const path = require('path');

function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  } catch (error) {
    console.error('Could not load .env.local:', error.message);
  }
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('=== Checking workspace tables ===');
  
  // Check workspaces table
  console.log('1. Checking autopostvn_workspaces:');
  const { data: workspaces, error: wError } = await supabase
    .from('autopostvn_workspaces')
    .select('*')
    .limit(5);
  
  if (wError) {
    console.error('  Error:', wError.message);
  } else {
    console.log('  Found', workspaces.length, 'workspaces');
    workspaces.forEach(w => console.log('    -', w.id, w.name));
  }
  
  // Check user_workspaces table
  console.log('\n2. Checking autopostvn_user_workspaces:');
  const { data: userWorkspaces, error: uwError } = await supabase
    .from('autopostvn_user_workspaces')
    .select('*')
    .limit(5);
  
  if (uwError) {
    console.error('  Error:', uwError.message);
  } else {
    console.log('  Found', userWorkspaces.length, 'user workspaces');
    userWorkspaces.forEach(uw => console.log('    -', uw.user_email, uw.workspace_id));
  }

  // Check for specific user
  console.log('\n3. Checking for test@autopostvn.com:');
  const { data: userWorkspace, error: userError } = await supabase
    .from('autopostvn_user_workspaces')
    .select('*')
    .eq('user_email', 'test@autopostvn.com')
    .single();
  
  if (userError) {
    console.error('  Error:', userError.message);
  } else {
    console.log('  Found workspace:', userWorkspace);
  }
}

checkTables().catch(console.error);

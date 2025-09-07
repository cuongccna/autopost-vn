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

async function checkWorkspaceIds() {
  try {
    console.log('=== Checking Workspace IDs ===');
    
    // Get scheduled posts
    const { data: posts, error: postsError } = await supabase
      .from('autopostvn_posts')
      .select('id, workspace_id, title')
      .eq('status', 'scheduled')
      .limit(3);
    
    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return;
    }
    
    console.log('Scheduled posts:');
    posts?.forEach(post => {
      console.log(`Post: ${post.title} - Workspace: ${post.workspace_id}`);
    });
    
    // Get social accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('autopostvn_social_accounts')
      .select('id, workspace_id, provider, name')
      .limit(5);
    
    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return;
    }
    
    console.log('\nSocial accounts:');
    accounts?.forEach(account => {
      console.log(`Account: ${account.name} (${account.provider}) - Workspace: ${account.workspace_id}`);
    });
    
    // Get workspaces
    const { data: workspaces, error: workspacesError } = await supabase
      .from('autopostvn_workspaces')
      .select('id, name, user_id');
    
    if (workspacesError) {
      console.error('Error fetching workspaces:', workspacesError);
      return;
    }
    
    console.log('\nWorkspaces:');
    workspaces?.forEach(ws => {
      console.log(`Workspace: ${ws.name} - ID: ${ws.id} - User: ${ws.user_id}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkWorkspaceIds();

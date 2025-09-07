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

async function createSocialAccountsForWorkspace() {
  try {
    const realWorkspaceId = 'e81c13d9-5a31-43b7-b117-6494033f40a8';
    
    console.log('=== Creating Social Accounts for Real Workspace ===');
    
    // Create test social accounts for the real workspace
    const newAccounts = [
      {
        workspace_id: realWorkspaceId,
        provider: 'facebook',
        provider_id: 'fb_test_123',
        name: 'Test Facebook Page',
        username: 'test_fb_page',
        token_encrypted: 'test_encrypted_token_fb',
        status: 'connected'
      },
      {
        workspace_id: realWorkspaceId,
        provider: 'instagram',
        provider_id: 'ig_test_456',
        name: 'Test Instagram Account',
        username: 'test_ig_account',
        token_encrypted: 'test_encrypted_token_ig',
        status: 'connected'
      }
    ];
    
    const { data, error } = await supabase
      .from('autopostvn_social_accounts')
      .insert(newAccounts)
      .select();
    
    if (error) {
      console.error('Error creating social accounts:', error);
      return;
    }
    
    console.log('✅ Created social accounts:');
    data?.forEach(account => {
      console.log(`- ${account.name} (${account.provider}): ${account.id}`);
    });
    
    // Now create schedules for the existing posts
    console.log('\n=== Creating Schedules for Existing Posts ===');
    
    const { data: posts, error: postsError } = await supabase
      .from('autopostvn_posts')
      .select('id, scheduled_at')
      .eq('status', 'scheduled')
      .eq('workspace_id', realWorkspaceId);
    
    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return;
    }
    
    for (const post of posts || []) {
      const schedules = data?.map(account => ({
        post_id: post.id,
        social_account_id: account.id,
        scheduled_at: post.scheduled_at,
        status: 'pending',
        retry_count: 0
      })) || [];
      
      if (schedules.length > 0) {
        const { error: scheduleError } = await supabase
          .from('autopostvn_post_schedules')
          .insert(schedules);
        
        if (scheduleError) {
          console.error(`Error creating schedules for post ${post.id}:`, scheduleError);
        } else {
          console.log(`✅ Created ${schedules.length} schedules for post ${post.id}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createSocialAccountsForWorkspace();

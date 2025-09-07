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

async function createMissingSchedules() {
  try {
    console.log('=== Creating Missing Schedules ===');
    
    // Get scheduled posts without schedules
    const { data: scheduledPosts, error: postsError } = await supabase
      .from('autopostvn_posts')
      .select('id, user_id, workspace_id, scheduled_at')
      .eq('status', 'scheduled')
      .not('scheduled_at', 'is', null);
    
    if (postsError) {
      console.error('Error fetching scheduled posts:', postsError);
      return;
    }
    
    console.log(`Found ${scheduledPosts?.length || 0} scheduled posts`);
    
    for (const post of scheduledPosts || []) {
      console.log(`\nProcessing post ${post.id}...`);
      
      // Get social accounts for this workspace
      const { data: accounts, error: accountsError } = await supabase
        .from('autopostvn_social_accounts')
        .select('id, provider')
        .eq('workspace_id', post.workspace_id)
        .eq('status', 'connected');
      
      if (accountsError) {
        console.error('Error fetching accounts:', accountsError);
        continue;
      }
      
      console.log(`Found ${accounts?.length || 0} active social accounts`);
      
      // Filter accounts based on platforms (assume all platforms for now)
      const relevantAccounts = accounts || [];
      
      console.log(`Relevant accounts: ${relevantAccounts.length}`);
      
      // Create schedule entries
      const schedules = relevantAccounts.map(account => ({
        post_id: post.id,
        social_account_id: account.id,
        scheduled_at: post.scheduled_at,
        status: 'pending',
        retry_count: 0
      }));
      
      if (schedules.length > 0) {
        const { error: scheduleError } = await supabase
          .from('autopostvn_post_schedules')
          .insert(schedules);
        
        if (scheduleError) {
          console.error('Error creating schedules:', scheduleError);
        } else {
          console.log(`✅ Created ${schedules.length} schedule entries for post ${post.id}`);
        }
      } else {
        console.log(`⚠️ No accounts found for post ${post.id}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createMissingSchedules();

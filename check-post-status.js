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

async function checkPostStatus() {
  try {
    console.log('=== Checking Post Status ===');
    
    const postIds = [
      'fc2cec6e-b922-4fd8-a58d-6628cb95e180',
      '5d43493c-ef97-4441-a814-fd5ccb4f313d',
      '3164cbb4-30c4-4a49-abfd-90f63a466b68'
    ];
    
    for (const postId of postIds) {
      const { data: post, error } = await supabase
        .from('autopostvn_posts')
        .select('id, title, status, scheduled_at')
        .eq('id', postId)
        .single();
      
      if (error) {
        console.error(`Error fetching post ${postId}:`, error);
        continue;
      }
      
      console.log(`
Post ID: ${post.id}
Title: ${post.title.substring(0, 50)}...
Status: ${post.status}
Scheduled: ${post.scheduled_at}
      `);
    }
    
    // Update posts to scheduled status
    console.log('\n=== Updating Posts to Scheduled Status ===');
    
    const { data, error } = await supabase
      .from('autopostvn_posts')
      .update({ status: 'scheduled' })
      .in('id', postIds)
      .select();
    
    if (error) {
      console.error('Error updating posts:', error);
    } else {
      console.log(`✅ Updated ${data?.length || 0} posts to scheduled status`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPostStatus();

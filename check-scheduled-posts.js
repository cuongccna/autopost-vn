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

async function checkScheduledPosts() {
  try {
    console.log('=== Checking Scheduled Posts ===');
    
    // Check posts table for scheduled posts
    const { data: posts, error: postsError } = await supabase
      .from('autopostvn_posts')
      .select('*')
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true });
    
    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return;
    }
    
    console.log('Scheduled posts found:', posts?.length || 0);
    if (posts && posts.length > 0) {
      posts.forEach(post => {
        const scheduledTime = new Date(post.scheduled_at);
        const now = new Date();
        const isPastDue = scheduledTime < now;
        
        console.log(`
Post ID: ${post.id}
Title: ${post.title}
Status: ${post.status}
Scheduled for: ${scheduledTime.toLocaleString('vi-VN')}
Current time: ${now.toLocaleString('vi-VN')}
Past due: ${isPastDue ? 'YES' : 'NO'}
Platforms: ${JSON.stringify(post.platforms)}
        `);
      });
    } else {
      console.log('No scheduled posts found');
    }
    
    // Check post usage table
    console.log('\n=== Checking Post Usage Table ===');
    const { data: usage, error: usageError } = await supabase
      .from('autopostvn_post_usage')
      .select('*')
      .eq('status', 'scheduled')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (usageError) {
      console.error('Error fetching usage:', usageError);
    } else {
      console.log('Recent scheduled posts in usage table:', usage?.length || 0);
      usage?.forEach(u => {
        console.log(`Usage ID: ${u.id}, Status: ${u.status}, Scheduled: ${u.scheduled_for}, Created: ${u.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkScheduledPosts();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key',
  {
    db: { schema: 'autopostvn' }
  }
);

async function checkData() {
  try {
    // Check posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(3);
    
    console.log('=== POSTS ===');
    console.log('Count:', posts?.length || 0);
    if (posts?.length > 0) {
      console.log('Sample post:', {
        id: posts[0].id,
        content: posts[0].content?.substring(0, 50) + '...',
        status: posts[0].status
      });
    }

    // Check schedules  
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .limit(3);
      
    console.log('\n=== SCHEDULES ===');
    console.log('Count:', schedules?.length || 0);
    if (schedules?.length > 0) {
      console.log('Sample schedule:', {
        id: schedules[0].id,
        post_id: schedules[0].post_id,
        scheduled_time: schedules[0].scheduled_time,
        status: schedules[0].status
      });
    }

    // Check social accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('*');
      
    console.log('\n=== SOCIAL ACCOUNTS ===');
    console.log('Count:', accounts?.length || 0);
    if (accounts?.length > 0) {
      console.log('Sample account:', {
        id: accounts[0].id,
        provider: accounts[0].provider,
        status: accounts[0].status,
        username: accounts[0].username
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkData();

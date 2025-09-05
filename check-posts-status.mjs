import { createClient } from '@supabase/supabase-js';

// Sử dụng thông tin Supabase thực
const supabaseUrl = 'https://fmvxmvahknbzzjzhofql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdnhtdmFoa25ienpqemhvZnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTczODUsImV4cCI6MjA3MTE5MzM4NX0.EK5HJzsQnL7be9kgjpaXJQ08OdTHdTI6kgbyNPIAdGg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPostsStatus() {
  try {
    console.log('🔍 Checking posts status distribution...\n');
    
    // Get all posts and their status
    const { data: posts, error } = await supabase
      .from('autopostvn_posts')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching posts:', error);
      return;
    }

    if (!posts || posts.length === 0) {
      console.log('📝 No posts found in database');
      return;
    }

    console.log(`📊 Total posts: ${posts.length}\n`);

    // Count by status
    const statusCounts = posts.reduce((acc, post) => {
      acc[post.status] = (acc[post.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 Status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = ((count / posts.length) * 100).toFixed(1);
      console.log(`  ${status}: ${count} posts (${percentage}%)`);
    });

    // Calculate success rate
    const publishedCount = statusCounts.published || 0;
    const successRate = posts.length > 0 ? (publishedCount / posts.length * 100).toFixed(1) : 0;
    
    console.log(`\n✅ Success Rate: ${successRate}%`);
    console.log(`   (${publishedCount} published out of ${posts.length} total)\n`);

    // Show recent posts
    console.log('📋 Recent posts:');
    posts.slice(0, 5).forEach((post, index) => {
      const statusEmoji = post.status === 'published' ? '✅' : 
                         post.status === 'failed' ? '❌' : '⏰';
      console.log(`  ${index + 1}. ${statusEmoji} ${post.title || 'Untitled'} (${post.status})`);
    });

  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

checkPostsStatus();

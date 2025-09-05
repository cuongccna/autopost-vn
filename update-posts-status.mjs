import { createClient } from '@supabase/supabase-js';

// Sử dụng thông tin Supabase thực
const supabaseUrl = 'https://fmvxmvahknbzzjzhofql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdnhtdmFoa25ienpqemhvZnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTczODUsImV4cCI6MjA3MTE5MzM4NX0.EK5HJzsQnL7be9kgjpaXJQ08OdTHdTI6kgbyNPIAdGg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePostsForTesting() {
  try {
    console.log('🔧 Updating posts status for testing...\n');
    
    // Get all posts
    const { data: posts, error: fetchError } = await supabase
      .from('autopostvn_posts')
      .select('id, title, status')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching posts:', fetchError);
      return;
    }

    if (!posts || posts.length === 0) {
      console.log('📝 No posts found');
      return;
    }

    console.log(`📊 Found ${posts.length} posts\n`);

    // Update first 3 posts to 'published', keep 1 'scheduled', and set 1 'failed'
    const updates = [
      { status: 'published', count: 3 },
      { status: 'scheduled', count: 1 }, 
      { status: 'failed', count: 1 }
    ];

    let postIndex = 0;
    
    for (const update of updates) {
      for (let i = 0; i < update.count && postIndex < posts.length; i++) {
        const post = posts[postIndex];
        
        const { error: updateError } = await supabase
          .from('autopostvn_posts')
          .update({ status: update.status })
          .eq('id', post.id);

        if (updateError) {
          console.error(`❌ Error updating post ${post.id}:`, updateError);
        } else {
          console.log(`✅ Updated "${post.title?.substring(0, 30)}..." → ${update.status}`);
        }
        
        postIndex++;
      }
    }

    console.log('\n🎯 Status distribution should now be:');
    console.log('  - 3 published (60%)');
    console.log('  - 1 scheduled (20%)'); 
    console.log('  - 1 failed (20%)');
    console.log('  - Success Rate: 60%\n');

    // Verify the changes
    console.log('🔍 Verifying updates...\n');
    
    const { data: updatedPosts, error: verifyError } = await supabase
      .from('autopostvn_posts')
      .select('id, title, status')
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
      return;
    }

    const statusCounts = updatedPosts.reduce((acc, post) => {
      acc[post.status] = (acc[post.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 Actual status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = ((count / updatedPosts.length) * 100).toFixed(1);
      console.log(`  ${status}: ${count} posts (${percentage}%)`);
    });

    const publishedCount = statusCounts.published || 0;
    const successRate = updatedPosts.length > 0 ? (publishedCount / updatedPosts.length * 100).toFixed(1) : 0;
    
    console.log(`\n✅ New Success Rate: ${successRate}%`);

  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

updatePostsForTesting();

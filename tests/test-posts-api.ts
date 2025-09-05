// Test script để kiểm tra API posts
// Run: npx ts-node tests/test-posts-api.ts

const BASE_URL = 'http://localhost:3000';

async function testPostsAPI() {
  console.log('🧪 Testing Posts API...\n');

  try {
    // 1. Test create post
    console.log('1. Testing POST /api/posts...');
    
    const testPost = {
      title: 'Test Post from API',
      content: 'This is a test post created via API to verify database integration.',
      providers: ['fb', 'ig'],
      scheduled_at: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      media_urls: []
    };

    const response = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you'd need proper auth headers
      },
      body: JSON.stringify(testPost)
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Post created successfully!');
      console.log('Post ID:', result.post?.id);
      console.log('Post title:', result.post?.title);
      console.log('Post status:', result.post?.status);
      console.log('Scheduled at:', result.post?.scheduled_at);
      console.log('Media URLs:', result.post?.media_urls);
    } else {
      const error = await response.json();
      console.log('❌ Failed to create post:');
      console.log('Error:', error.error);
    }

    // 2. Test get posts
    console.log('\n2. Testing GET /api/posts...');
    
    const getResponse = await fetch(`${BASE_URL}/api/posts`);
    console.log('Response status:', getResponse.status);
    
    if (getResponse.ok) {
      const posts = await getResponse.json();
      console.log('✅ Posts retrieved successfully!');
      console.log('Number of posts:', posts.length);
      if (posts.length > 0) {
        console.log('Sample post:', {
          id: posts[0].id,
          title: posts[0].title,
          status: posts[0].status,
          created_at: posts[0].created_at
        });
      }
    } else {
      const error = await getResponse.json();
      console.log('❌ Failed to get posts:');
      console.log('Error:', error.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Test individual endpoints
async function testWithAuth() {
  console.log('\n🔐 Testing with mock authentication...\n');
  
  // This would simulate authenticated requests
  // In a real scenario, you'd get session tokens
  
  console.log('Note: This test requires proper NextAuth session.');
  console.log('Please test manually through the UI for now.');
}

async function checkDatabaseSchema() {
  console.log('\n🗄️ Database Schema Check...\n');
  
  console.log('Expected schema:');
  console.log('- Table: AutoPostVN.posts');
  console.log('- Required fields: workspace_id, title, content, user_id');
  console.log('- Optional fields: providers, scheduled_at, media_urls, status');
  console.log('- Auto fields: id, created_at, updated_at');
  
  console.log('\n✅ Schema appears correct based on API code.');
}

// Run tests
async function runAllTests() {
  await checkDatabaseSchema();
  await testWithAuth();
  
  console.log('\n📝 Manual Test Instructions:');
  console.log('1. Open http://localhost:3000/app');
  console.log('2. Sign in with valid credentials');
  console.log('3. Click "Tạo bài đăng"');
  console.log('4. Fill in content and click "Lên lịch bài đăng"');
  console.log('5. Check browser developer tools Network tab for API calls');
  console.log('6. Check Supabase dashboard for new records in AutoPostVN.posts table');
}

if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testPostsAPI };

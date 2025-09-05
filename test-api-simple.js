// Simple test cho POST API để kiểm tra lỗi workspace
const testCreatePost = async () => {
  console.log('=== Testing POST /api/posts ===');
  
  const testData = {
    title: 'Test Post',
    content: 'Test content for debugging',
    providers: ['facebook', 'instagram'], // Sử dụng mapped providers
    scheduled_at: null,
    media_urls: []
  };

  try {
    const response = await fetch('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: Cần authentication token thực tế
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.log('❌ Error:', result.error);
    } else {
      console.log('✅ Success:', result.message);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
};

// Chạy test
testCreatePost();

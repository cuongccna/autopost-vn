// Test tạo activity logs qua API
async function createTestActivityLogs() {
  const testLogs = [
    {
      action_type: 'post_created',
      entity_type: 'post', 
      entity_id: 'test-post-1',
      description: 'Tạo bài đăng mới: "Khuyến mãi cuối tuần"',
      action_category: 'post',
      status: 'success',
      details: { 
        title: 'Khuyến mãi cuối tuần', 
        providers: ['facebook', 'instagram'],
        scheduled_time: '2025-09-07T10:00:00Z'
      }
    },
    {
      action_type: 'account_connected',
      entity_type: 'social_account',
      entity_id: 'fb-page-1', 
      description: 'Kết nối tài khoản Facebook Page',
      action_category: 'account',
      status: 'success',
      details: {
        provider: 'facebook',
        account_name: 'Autopost VN Official',
        account_id: 'fb_page_123456789'
      }
    },
    {
      action_type: 'post_published',
      entity_type: 'post',
      entity_id: 'test-post-2',
      description: 'Đăng bài thành công lên Instagram',
      action_category: 'post', 
      status: 'success',
      details: {
        provider: 'instagram',
        post_url: 'https://instagram.com/p/abc123',
        engagement: { likes: 24, comments: 5 }
      }
    },
    {
      action_type: 'post_failed',
      entity_type: 'post',
      entity_id: 'test-post-3',
      description: 'Lỗi đăng bài lên Instagram',
      action_category: 'post',
      status: 'failed',
      error_message: 'Instagram API rate limit exceeded',
      details: {
        provider: 'instagram',
        error_code: 'RATE_LIMIT',
        retry_after: 3600
      }
    },
    {
      action_type: 'workspace_updated',
      entity_type: 'workspace',
      entity_id: 'workspace-1',
      description: 'Cập nhật cài đặt workspace',
      action_category: 'workspace',
      status: 'success',
      details: {
        changes: ['timezone', 'notification_settings'],
        timezone: 'Asia/Ho_Chi_Minh'
      }
    }
  ];

  console.log('Tạo', testLogs.length, 'activity logs test...');
  
  for (let i = 0; i < testLogs.length; i++) {
    const log = testLogs[i];
    try {
      const response = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(log)
      });
      
      if (response.ok) {
        console.log(`✅ Log ${i + 1}: ${log.description}`);
      } else {
        const error = await response.text();
        console.log(`❌ Log ${i + 1} failed:`, error);
      }
    } catch (error) {
      console.log(`❌ Log ${i + 1} error:`, error);
    }
    
    // Delay ngắn giữa các request
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('Hoàn thành tạo test logs!');
}

// Auto run khi load page
if (typeof window !== 'undefined') {
  window.createTestActivityLogs = createTestActivityLogs;
  console.log('Chạy createTestActivityLogs() để tạo dữ liệu test');
}

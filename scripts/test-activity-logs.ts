import { ActivityLogService } from '@/lib/services/activity-log.service';
import { ACTION_TYPES, createLogDescription } from '@/types/activity-logs';

// Test script để kiểm tra Activity Logs
async function testActivityLogs() {
  console.log('🧪 Testing Activity Logs System...\n');
  
  // Mock user ID (thay bằng user ID thực tế từ auth.users)
  const testUserId = '00000000-0000-0000-0000-000000000000'; // Thay bằng UUID thực
  const testWorkspaceId = '11111111-1111-1111-1111-111111111111'; // Thay bằng workspace UUID thực
  
  try {
    // Test 1: Ghi nhật ký đăng nhập
    console.log('📝 Test 1: Ghi nhật ký đăng nhập...');
    const loginLog = await ActivityLogService.log(
      testUserId,
      {
        action_type: ACTION_TYPES.AUTH.LOGIN,
        action_category: 'auth',
        description: createLogDescription(ACTION_TYPES.AUTH.LOGIN),
        status: 'success',
        duration_ms: 150,
        additional_data: {
          browser: 'Chrome',
          device: 'Desktop'
        }
      },
      {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        requestId: 'req_' + Date.now(),
        sessionId: 'sess_' + Date.now()
      }
    );
    
    if (loginLog) {
      console.log('✅ Ghi nhật ký đăng nhập thành công:', loginLog.id);
    } else {
      console.log('❌ Ghi nhật ký đăng nhập thất bại');
    }
    
    // Test 2: Ghi nhật ký tạo bài đăng
    console.log('\n📝 Test 2: Ghi nhật ký tạo bài đăng...');
    const postLog = await ActivityLogService.log(
      testUserId,
      {
        action_type: ACTION_TYPES.POST.CREATE,
        action_category: 'post',
        description: 'Tạo bài đăng mới: Khuyến mãi tháng 9',
        workspace_id: testWorkspaceId,
        target_resource_type: 'post',
        target_resource_id: '22222222-2222-2222-2222-222222222222',
        new_data: {
          title: 'Khuyến mãi tháng 9',
          content: 'Giảm giá 50% tất cả sản phẩm',
          platforms: ['facebook', 'instagram']
        },
        status: 'success',
        duration_ms: 2500,
        additional_data: {
          media_count: 2,
          scheduled_time: new Date().toISOString()
        }
      }
    );
    
    if (postLog) {
      console.log('✅ Ghi nhật ký tạo bài đăng thành công:', postLog.id);
    } else {
      console.log('❌ Ghi nhật ký tạo bài đăng thất bại');
    }
    
    // Test 3: Ghi nhật ký lỗi kết nối tài khoản
    console.log('\n📝 Test 3: Ghi nhật ký lỗi kết nối tài khoản...');
    const errorLog = await ActivityLogService.log(
      testUserId,
      {
        action_type: ACTION_TYPES.ACCOUNT.CONNECT,
        action_category: 'account',
        description: 'Lỗi kết nối tài khoản Facebook',
        workspace_id: testWorkspaceId,
        target_resource_type: 'social_account',
        status: 'failed',
        error_message: 'Invalid access token',
        duration_ms: 5000,
        additional_data: {
          provider: 'facebook',
          error_code: 'OAuthException',
          retry_count: 3
        }
      }
    );
    
    if (errorLog) {
      console.log('✅ Ghi nhật ký lỗi thành công:', errorLog.id);
    } else {
      console.log('❌ Ghi nhật ký lỗi thất bại');
    }
    
    // Test 4: Lấy nhật ký người dùng
    console.log('\n📋 Test 4: Lấy nhật ký người dùng...');
    const userLogs = await ActivityLogService.getUserLogs(testUserId, {
      limit: 10,
      action_category: 'post'
    });
    
    console.log(`✅ Tìm thấy ${userLogs.logs.length} nhật ký, tổng: ${userLogs.total}`);
    userLogs.logs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.description} - ${log.status} (${log.created_at})`);
    });
    
    // Test 5: Thống kê hoạt động
    console.log('\n📊 Test 5: Thống kê hoạt động...');
    const stats = await ActivityLogService.getActivityStats(testUserId, testWorkspaceId, 7);
    
    console.log('✅ Thống kê hoạt động:');
    console.log(`   - Tổng hoạt động: ${stats.total_actions}`);
    console.log(`   - Tỷ lệ thành công: ${stats.success_rate}%`);
    console.log(`   - Theo danh mục:`, stats.by_category);
    console.log(`   - Theo ngày: ${stats.by_day.length} ngày có hoạt động`);
    
    // Test 6: Cleanup logs cũ (test với 0 ngày để thấy function hoạt động)
    console.log('\n🧹 Test 6: Test cleanup function...');
    const cleanupCount = await ActivityLogService.cleanupOldLogs(365); // Chỉ xóa logs cũ hơn 1 năm
    console.log(`✅ Cleanup function hoạt động: ${cleanupCount} logs được xóa`);
    
    console.log('\n🎉 Tất cả tests đã hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  }
}

// Test helper functions
async function testLogDescriptions() {
  console.log('\n📝 Testing log descriptions...');
  
  const testCases = [
    {
      actionType: ACTION_TYPES.AUTH.LOGIN,
      details: {},
      expected: 'Đăng nhập vào hệ thống'
    },
    {
      actionType: ACTION_TYPES.POST.CREATE,
      details: { title: 'Bài test' },
      expected: 'Tạo bài đăng mới: Bài test'
    },
    {
      actionType: ACTION_TYPES.ACCOUNT.CONNECT,
      details: { provider: 'facebook', name: 'Page ABC' },
      expected: 'Kết nối tài khoản facebook: Page ABC'
    }
  ];
  
  testCases.forEach((testCase, index) => {
    const description = createLogDescription(testCase.actionType, testCase.details);
    console.log(`   ${index + 1}. ${testCase.actionType}: "${description}"`);
    
    if (description === testCase.expected) {
      console.log('      ✅ Chính xác');
    } else {
      console.log(`      ❌ Mong đợi: "${testCase.expected}"`);
    }
  });
}

// Export để có thể chạy từ API hoặc script
export { testActivityLogs, testLogDescriptions };

// Chạy test nếu file được execute trực tiếp
if (require.main === module) {
  testActivityLogs().then(() => {
    testLogDescriptions();
  });
}

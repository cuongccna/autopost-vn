# AutoPost VN - System Activity Logs Documentation

## 📋 Tổng quan

Hệ thống nhật ký hoạt động cho phép theo dõi và ghi lại tất cả các hành động của người dùng trong AutoPost VN. Nhật ký được tổ chức theo user ID và hỗ trợ filtering, pagination và thống kê.

## 🗄️ Database Schema

### Bảng: `autopostvn_system_activity_logs`

```sql
-- Nhật ký hoạt động hệ thống
CREATE TABLE public.autopostvn_system_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE cascade,
  workspace_id uuid REFERENCES public.autopostvn_workspaces(id) ON DELETE cascade,
  
  -- Thông tin hoạt động
  action_type text NOT NULL, -- 'login', 'create_post', 'connect_account', etc
  action_category text NOT NULL CHECK (action_category IN ('auth', 'post', 'account', 'workspace', 'admin', 'api')),
  description text NOT NULL, -- Mô tả chi tiết bằng tiếng Việt
  
  -- Metadata
  target_resource_type text, -- 'post', 'social_account', 'workspace', etc
  target_resource_id uuid, -- ID của resource được tác động
  previous_data jsonb DEFAULT '{}'::jsonb, -- Dữ liệu trước khi thay đổi
  new_data jsonb DEFAULT '{}'::jsonb, -- Dữ liệu sau khi thay đổi
  
  -- Request context
  ip_address inet,
  user_agent text,
  request_id text,
  session_id text,
  
  -- Status và metadata
  status text CHECK (status IN ('success', 'failed', 'warning')) DEFAULT 'success',
  error_message text,
  duration_ms int, -- Thời gian thực hiện (milliseconds)
  additional_data jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now()
);
```

### Indexes để tối ưu performance:
- `idx_autopostvn_activity_logs_user_id` - Theo user_id và created_at
- `idx_autopostvn_activity_logs_workspace_id` - Theo workspace_id và created_at  
- `idx_autopostvn_activity_logs_action_category` - Theo action_category
- `idx_autopostvn_activity_logs_action_type` - Theo action_type
- `idx_autopostvn_activity_logs_target_resource` - Theo target_resource
- `idx_autopostvn_activity_logs_status` - Theo status
- `idx_autopostvn_activity_logs_created_at` - Theo thời gian tạo

## 🔗 API Endpoints

### 1. Ghi nhật ký hoạt động
```http
POST /api/activity-logs
Content-Type: application/json

{
  "action_type": "create_post",
  "action_category": "post",
  "description": "Tạo bài đăng mới: Khuyến mãi tháng 9",
  "workspace_id": "uuid",
  "target_resource_type": "post",
  "target_resource_id": "uuid",
  "new_data": { "title": "Khuyến mãi tháng 9", "content": "..." },
  "status": "success",
  "duration_ms": 1250,
  "additional_data": { "platforms": ["facebook", "instagram"] }
}
```

### 2. Lấy nhật ký người dùng
```http
GET /api/activity-logs?action_category=post&status=success&limit=20&offset=0
```

**Query Parameters:**
- `action_category`: 'auth' | 'post' | 'account' | 'workspace' | 'admin' | 'api'
- `action_type`: Loại hành động cụ thể
- `status`: 'success' | 'failed' | 'warning'
- `target_resource_type`: Loại resource
- `date_from`: Từ ngày (ISO string)
- `date_to`: Đến ngày (ISO string)
- `limit`: Số lượng records (default: 50)
- `offset`: Vị trí bắt đầu (default: 0)

### 3. Lấy nhật ký workspace
```http
GET /api/activity-logs/workspace/{workspaceId}?action_category=post&limit=50
```

### 4. Thống kê hoạt động
```http
GET /api/activity-logs/stats?workspace_id=uuid&days=30
```

**Response:**
```json
{
  "total_actions": 245,
  "success_rate": 97.5,
  "by_category": {
    "post": 120,
    "account": 45,
    "auth": 80
  },
  "by_day": [
    { "date": "2025-09-01", "count": 15 },
    { "date": "2025-09-02", "count": 23 }
  ]
}
```

## 🎯 Action Types

### Authentication (auth)
- `login` - Đăng nhập
- `logout` - Đăng xuất
- `register` - Đăng ký
- `password_reset` - Đặt lại mật khẩu
- `email_verify` - Xác thực email

### Posts (post)
- `create_post` - Tạo bài đăng
- `update_post` - Cập nhật bài đăng
- `delete_post` - Xóa bài đăng
- `schedule_post` - Lên lịch đăng bài
- `publish_post` - Đăng bài
- `cancel_post` - Hủy lịch đăng
- `duplicate_post` - Nhân đôi bài đăng

### Accounts (account)
- `connect_account` - Kết nối tài khoản
- `disconnect_account` - Ngắt kết nối
- `refresh_token` - Làm mới token
- `sync_account` - Đồng bộ dữ liệu

### Workspace (workspace)
- `create_workspace` - Tạo workspace
- `update_workspace` - Cập nhật workspace
- `delete_workspace` - Xóa workspace
- `invite_user` - Mời người dùng
- `remove_user` - Xóa người dùng

### Admin (admin)
- `view_logs` - Xem nhật ký
- `export_data` - Xuất dữ liệu
- `manage_users` - Quản lý người dùng
- `system_config` - Cấu hình hệ thống

### API (api)
- `create_api_key` - Tạo API key
- `delete_api_key` - Xóa API key
- `api_call` - Gọi API
- `webhook_trigger` - Kích hoạt webhook

## 🚀 Sử dụng trong React

### 1. Hook ghi nhật ký
```tsx
import { useLogActivity } from '@/hooks/useActivityLogs';

function MyComponent() {
  const { logPost, logging } = useLogActivity();
  
  const handleCreatePost = async (postData) => {
    const startTime = Date.now();
    
    try {
      const result = await createPost(postData);
      
      // Ghi nhật ký thành công
      await logPost('CREATE', {
        description: `Tạo bài đăng mới: ${postData.title}`,
        target_resource_type: 'post',
        target_resource_id: result.id,
        new_data: postData,
        duration_ms: Date.now() - startTime,
        additional_data: { platforms: postData.platforms }
      });
      
    } catch (error) {
      // Ghi nhật ký lỗi
      await logPost('CREATE', {
        description: `Lỗi tạo bài đăng: ${postData.title}`,
        status: 'failed',
        error_message: error.message,
        duration_ms: Date.now() - startTime,
        additional_data: { error: error.toString() }
      });
    }
  };
}
```

### 2. Hook hiển thị nhật ký
```tsx
import { useActivityLogs } from '@/hooks/useActivityLogs';

function ActivityLogsList() {
  const { logs, loading, loadMore, hasMore } = useActivityLogs({
    action_category: 'post',
    limit: 20
  });
  
  if (loading) return <div>Đang tải...</div>;
  
  return (
    <div>
      {logs.map(log => (
        <div key={log.id} className="p-4 border rounded">
          <h3>{log.description}</h3>
          <p className="text-sm text-gray-500">
            {new Date(log.created_at).toLocaleString('vi-VN')}
          </p>
          {log.duration_ms && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {log.duration_ms}ms
            </span>
          )}
        </div>
      ))}
      
      {hasMore && (
        <button onClick={loadMore}>Tải thêm</button>
      )}
    </div>
  );
}
```

### 3. Component nhật ký hoàn chỉnh
```tsx
import ActivityLogsView from '@/components/features/ActivityLogsView';

function UserDashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Hiển thị nhật ký với filters */}
      <ActivityLogsView 
        showFilters={true}
        limit={50}
      />
    </div>
  );
}
```

## 📊 Thống kê và Báo cáo

### Hook thống kê
```tsx
import { useActivityStats } from '@/hooks/useActivityLogs';

function ActivityStats({ workspaceId }) {
  const { stats, loading } = useActivityStats(workspaceId, 30);
  
  if (loading) return <div>Đang tải thống kê...</div>;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 bg-blue-50 rounded">
        <h3 className="font-medium">Tổng hoạt động</h3>
        <p className="text-2xl font-bold text-blue-600">
          {stats?.total_actions}
        </p>
      </div>
      
      <div className="p-4 bg-green-50 rounded">
        <h3 className="font-medium">Tỷ lệ thành công</h3>
        <p className="text-2xl font-bold text-green-600">
          {stats?.success_rate}%
        </p>
      </div>
      
      {/* Biểu đồ theo danh mục */}
      <div className="col-span-2">
        <h3 className="font-medium mb-2">Theo danh mục</h3>
        {Object.entries(stats?.by_category || {}).map(([category, count]) => (
          <div key={category} className="flex justify-between">
            <span>{category}</span>
            <span className="font-medium">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🛡️ Bảo mật

### Row Level Security (RLS)
- Users chỉ xem được nhật ký của mình
- Workspace members xem được nhật ký workspace (nếu thuộc workspace)
- Service role có quyền insert logs

### Policies đã thiết lập:
1. **User logs**: `auth.uid() = user_id`
2. **Workspace logs**: Kiểm tra membership
3. **Insert logs**: Service role only

## 🔧 Maintenance

### Cleanup nhật ký cũ
```tsx
import { ActivityLogService } from '@/lib/services/activity-log.service';

// Xóa logs cũ hơn 90 ngày
const deletedCount = await ActivityLogService.cleanupOldLogs(90);
console.log(`Đã xóa ${deletedCount} nhật ký cũ`);
```

### Scheduled cleanup (có thể thêm vào cron job)
```tsx
// scripts/cleanup-logs.ts
import { ActivityLogService } from '@/lib/services/activity-log.service';

async function cleanupLogs() {
  const deletedCount = await ActivityLogService.cleanupOldLogs(90);
  console.log(`Cleanup completed: ${deletedCount} logs deleted`);
}

// Chạy hàng ngày
cleanupLogs();
```

## 📝 Best Practices

### 1. Ghi nhật ký hiệu quả
- Luôn include duration_ms cho performance monitoring
- Sử dụng description tiếng Việt rõ ràng
- Include target_resource_type và target_resource_id khi có thể
- Ghi cả previous_data và new_data cho audit trail

### 2. Error handling
- Đừng để lỗi ghi log ảnh hưởng main flow
- Sử dụng try-catch cho tất cả log operations
- Ghi log cả successful và failed operations

### 3. Performance
- Sử dụng pagination cho large datasets
- Index các trường thường filter
- Cleanup nhật ký cũ định kỳ
- Batch insert khi có nhiều logs cùng lúc

---

**AutoPost VN Activity Logs** - Theo dõi mọi hoạt động một cách chuyên nghiệp! 🇻🇳

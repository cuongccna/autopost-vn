# Workspace Settings Implementation - Complete Guide

## 📋 Tổng quan

Đã hoàn thành việc triển khai Workspace Settings - lưu trữ và áp dụng cài đặt workspace vào database và các service thực tế.

## ✅ Đã hoàn thành

### 1. Database Migration
**File**: `migrations/009_add_workspace_settings.sql`

- ✅ Cập nhật cột `settings` (JSONB) trong bảng `autopostvn_workspaces`
- ✅ Thêm default settings cho các workspace hiện tại
- ✅ Tạo function `get_workspace_settings(uuid)` 
- ✅ Tạo function `update_workspace_settings(uuid, jsonb)`

**Cấu trúc Settings**:
```json
{
  "notifications": {
    "onSuccess": true,
    "onFailure": true,
    "onTokenExpiry": true
  },
  "scheduling": {
    "timezone": "Asia/Ho_Chi_Minh",
    "goldenHours": ["09:00", "12:30", "20:00"],
    "rateLimit": 10
  },
  "advanced": {
    "autoDeleteOldPosts": false,
    "autoDeleteDays": 30,
    "testMode": false
  }
}
```

### 2. API Endpoints
**File**: `src/app/api/workspace/settings/route.ts`

**GET /api/workspace/settings**
- Lấy settings của workspace
- Tự động merge với default settings
- Query param: `?workspace_id=xxx` (optional)

**PUT /api/workspace/settings**
- Cập nhật settings
- Validation: timezone, golden hours (max 3), rate limit (1-100)
- Body:
```json
{
  "workspaceId": "uuid",
  "settings": { ... }
}
```

### 3. Frontend Component
**File**: `src/components/features/Settings.tsx`

**Cập nhật**:
- ✅ Load settings từ API khi mount
- ✅ Save settings vào database qua API
- ✅ Hiển thị loading state
- ✅ Hiển thị error message
- ✅ Thêm controls cho `autoDelete`, `autoDeleteDays`, `testMode`

**Features mới**:
```tsx
interface SettingsData {
  notifySuccess: boolean;
  notifyFail: boolean;
  notifyToken: boolean;
  timezone: string;
  golden: string[];
  rateLimit: number;
  autoDelete: boolean;        // ⭐ MỚI
  autoDeleteDays: number;     // ⭐ MỚI
  testMode: boolean;          // ⭐ MỚI
}
```

### 4. Workspace Settings Service
**File**: `src/lib/services/workspace-settings.service.ts`

**Methods**:
- ✅ `getSettings(workspaceId)` - Lấy settings từ DB
- ✅ `isGoldenHour(settings, datetime?)` - Kiểm tra giờ vàng
- ✅ `getNextGoldenHour(settings, fromDate?)` - Tìm giờ vàng tiếp theo
- ✅ `checkRateLimit(workspaceId, settings)` - Kiểm tra rate limit
- ✅ `shouldNotify(settings, type)` - Kiểm tra gửi thông báo
- ✅ `isTestMode(settings)` - Kiểm tra test mode

### 5. Scheduler Integration
**File**: `src/lib/scheduler.ts`

**Áp dụng Settings**:
```typescript
// 1. Test Mode
if (settings.advanced.testMode) {
  // Simulate publish, không post thật
  await updateJobStatus(job.id, 'published', 'Test mode: Simulated publish');
  continue;
}

// 2. Rate Limit Check
const rateLimit = await WorkspaceSettingsService.checkRateLimit(workspaceId, settings);
if (!rateLimit.allowed) {
  // Skip và retry sau
  result.skipped++;
  continue;
}
```

### 6. UI Components
**File**: `src/components/shared/GoldenHoursSuggestion.tsx`

**Golden Hours Suggestion Component**:
- Hiển thị 3 giờ vàng từ settings
- Highlight giờ sắp đến (trong 30 phút)
- Disable giờ đã qua
- Auto-schedule cho ngày mai nếu chọn giờ đã qua
- Hiển thị timezone

## 🚀 Cách sử dụng

### 1. Chạy Migration (Đã hoàn thành)
```sql
-- Chạy file migrations/009_add_workspace_settings.sql trên Supabase SQL Editor
```

### 2. Test API
```bash
node test-workspace-settings-api.js
```

### 3. Sử dụng trong Code

**Load Settings**:
```typescript
import { WorkspaceSettingsService } from '@/lib/services/workspace-settings.service';

const settings = await WorkspaceSettingsService.getSettings(workspaceId);
```

**Check Golden Hour**:
```typescript
if (WorkspaceSettingsService.isGoldenHour(settings)) {
  console.log('Đang trong giờ vàng!');
}

const nextGolden = WorkspaceSettingsService.getNextGoldenHour(settings);
console.log('Giờ vàng tiếp theo:', nextGolden);
```

**Check Rate Limit**:
```typescript
const rateLimit = await WorkspaceSettingsService.checkRateLimit(workspaceId, settings);
if (!rateLimit.allowed) {
  console.log(`Rate limit: ${rateLimit.current}/${rateLimit.limit}`);
}
```

**Check Notifications**:
```typescript
if (WorkspaceSettingsService.shouldNotify(settings, 'success')) {
  await sendSuccessNotification();
}
```

## 📊 Tác động

### Database
- ✅ Tất cả workspaces đã có default settings
- ✅ Settings được lưu trữ dưới dạng JSONB
- ✅ Helper functions sẵn sàng sử dụng

### API
- ✅ `/api/workspace/settings` - GET/PUT hoạt động
- ✅ Validation đầy đủ
- ✅ Error handling chuẩn

### Scheduler
- ✅ Test mode: Không post thật khi bật
- ✅ Rate limit: Kiểm tra số bài/giờ
- ✅ Timezone aware: Sử dụng timezone từ settings

### UI
- ✅ Settings được load từ DB khi vào trang
- ✅ Save vào DB khi click "Lưu cài đặt"
- ✅ Không còn mất settings khi reload page

## 🎯 Tính năng chính

### 1. Notifications
- Thông báo khi đăng thành công
- Thông báo khi đăng thất bại
- Nhắc hạn token sắp hết

### 2. Scheduling
- **Timezone**: Múi giờ workspace (mặc định: Asia/Ho_Chi_Minh)
- **Golden Hours**: 3 khung giờ vàng đề xuất
- **Rate Limit**: Số bài tối đa/giờ (1-100)

### 3. Advanced
- **Auto Delete**: Tự động xóa bài cũ
- **Auto Delete Days**: Số ngày lưu trữ (mặc định: 30)
- **Test Mode**: Chế độ thử nghiệm không post thật

## 🔄 Luồng hoạt động

```
User thay đổi settings trong UI
    ↓
Settings.tsx gọi PUT /api/workspace/settings
    ↓
API validate và lưu vào DB (autopostvn_workspaces.settings)
    ↓
Scheduler load settings khi xử lý job
    ↓
Áp dụng: Test mode, Rate limit, Timezone
    ↓
Publish hoặc Skip dựa trên settings
```

## 📝 Testing

**Test Cases**:
1. ✅ GET settings - Trả về settings hoặc default
2. ✅ PUT settings - Update và validate
3. ✅ Scheduler test mode - Simulate publish
4. ✅ Scheduler rate limit - Skip khi vượt quá
5. ✅ UI load settings - Hiển thị đúng giá trị
6. ✅ UI save settings - Lưu thành công

**Scripts**:
- `test-workspace-settings-api.js` - Test API endpoints
- Manual test trên UI: Settings page

## 🐛 Known Issues

**Đã fix**:
- ✅ Settings không lưu vào DB (chỉ lưu state)
- ✅ Settings bị mất khi reload page
- ✅ Scheduler không tuân theo rate limit
- ✅ Không có test mode

**Chưa implement**:
- ⏳ Auto delete old posts (cron job)
- ⏳ Email notification service
- ⏳ Golden hours analytics
- ⏳ Timezone conversion trong UI

## 📚 Files Changed

### Created
1. `migrations/009_add_workspace_settings.sql`
2. `src/app/api/workspace/settings/route.ts`
3. `src/lib/services/workspace-settings.service.ts`
4. `src/components/shared/GoldenHoursSuggestion.tsx`
5. `test-workspace-settings-api.js`

### Modified
1. `src/components/features/Settings.tsx` - Load/save từ API
2. `src/app/app/page.tsx` - Update interface
3. `src/lib/scheduler.ts` - Integrate settings

## 🎉 Kết luận

Workspace Settings đã được triển khai hoàn chỉnh:
- ✅ Database: Lưu trữ JSONB với default values
- ✅ API: GET/PUT endpoints với validation
- ✅ Service: Helper functions đầy đủ
- ✅ Scheduler: Áp dụng test mode & rate limit
- ✅ UI: Load/save settings thành công

**Next Steps**:
1. Test trên production
2. Implement auto-delete cron job
3. Thêm notification service
4. Analytics cho golden hours effectiveness

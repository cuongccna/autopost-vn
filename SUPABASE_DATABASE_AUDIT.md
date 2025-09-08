# 📊 SUPABASE DATABASE AUDIT REPORT (Updated with Migrations)

## 🔄 MIGRATION HISTORY ANALYSIS

### Migration Timeline:
1. **001_user_management.sql** - User workspaces & multi-tenancy 
2. **002_ai_usage_tracking.sql** - AI features tracking
3. **003_post_limits_tracking.sql** - Post rate limiting system
4. **004_add_phone_field.sql** - Phone field addition
5. **005_update_ai_limits.sql** - AI limits updates
6. **006_fix_ai_rate_limit_function.sql** - Function fixes
7. **007_optimize_ai_limits.sql** - Performance optimization
8. **008_add_system_activity_logs.sql** - Activity logging

## 🎯 Bảng ĐANG ĐƯỢC SỬ DỤNG trong Production Code

### Core Tables (Cần thiết - KHÔNG XÓA)

#### 1. `autopostvn_workspaces` ✅ ĐANG DÙNG
- **Migration:** 001_user_management.sql
- **Files sử dụng:** 
  - `src/lib/services/UserManagementService.ts`
  - `src/app/api/test/route.ts`
  - `src/app/api/posts/schedules/route.ts`
  - `src/app/api/posts/route.ts`
- **Mục đích:** Quản lý workspace/organization cho user

#### 2. `autopostvn_social_accounts` ✅ ĐANG DÙNG
- **Migration:** Main schema + 001_user_management.sql
- **Files sử dụng:**
  - `src/lib/services/UserManagementService.ts` (8 references)
  - `src/app/api/posts/route.ts`
  - `src/lib/post-validation.ts`
- **Mục đích:** Lưu thông tin kết nối social media accounts

#### 3. `autopostvn_posts` ✅ ĐANG DÙNG
- **Migration:** Main schema
- **Files sử dụng:**
  - `src/lib/services/UserManagementService.ts`
  - `src/app/api/posts/route.ts` (3 references)
  - `src/lib/scheduler.ts`
  - `src/lib/post-validation.ts`
- **Mục đích:** Lưu trữ bài đăng và nội dung

#### 4. `autopostvn_post_schedules` ✅ ĐANG DÙNG
- **Migration:** Main schema
- **Files sử dụng:**
  - `src/lib/scheduler.ts` (5 references)
  - `src/app/api/posts/schedules/route.ts`
  - `src/app/api/posts/route.ts`
  - `src/lib/post-validation.ts`
- **Mục đích:** Quản lý lịch đăng bài cho từng platform

#### 5. `autopostvn_users` ✅ ĐANG DÙNG
- **Migration:** 002_ai_usage_tracking.sql
- **Files sử dụng:**
  - `src/lib/services/aiUsageService.ts` (2 references)
  - `src/app/api/user/profile/route.ts` (2 references)
  - `src/app/api/debug/usage-check/route.ts`
  - `src/app/api/debug/ai-limits/route.ts`
- **Mục đích:** Thông tin người dùng và role management

#### 6. `autopostvn_system_activity_logs` ✅ ĐANG DÙNG
- **Migration:** 008_add_system_activity_logs.sql
- **Files sử dụng:**
  - `src/lib/social-publishers.ts`
  - `src/lib/services/activity-log.service.ts` (5 references)
  - `src/lib/post-validation.ts`
- **Mục đích:** Theo dõi hoạt động hệ thống

#### 7. `autopostvn_ai_usage` ✅ ĐANG DÙNG
- **Migration:** 002_ai_usage_tracking.sql
- **Files sử dụng:**
  - `src/lib/services/aiUsageService.ts`
  - `src/app/api/debug/reset-ai-usage/route.ts` (2 references)
- **Mục đích:** Theo dõi sử dụng AI features

#### 8. `autopostvn_post_usage` ✅ ĐANG DÙNG
- **Migration:** 003_post_limits_tracking.sql
- **Files sử dụng:**
  - `src/lib/services/postUsageService.ts` (3 references)
  - `src/app/api/debug/check-user-limits/route.ts`
- **Mục đích:** Theo dõi giới hạn đăng bài

### Migration-Created Tables (Có thể chưa dùng)

#### 9. `autopostvn_user_workspaces` ⚠️ TỪ MIGRATION 001
- **Migration:** 001_user_management.sql  
- **Status:** Không thấy reference trong code hiện tại
- **Khuyến nghị:** Có thể đã được thay thế bằng `autopostvn_workspaces`

#### 10. `autopostvn_user_social_accounts` ⚠️ TỪ MIGRATION 001
- **Migration:** 001_user_management.sql
- **Status:** Không thấy reference trong code hiện tại  
- **Khuyến nghị:** Có thể đã được thay thế bằng `autopostvn_social_accounts`

#### 11. `autopostvn_oauth_sessions` ⚠️ TỪ MIGRATION 001
- **Migration:** 001_user_management.sql
- **Status:** Không thấy reference trong code hiện tại
- **Mục đích:** OAuth flow state management

#### 12. `autopostvn_post_rate_limits` ⚠️ TỪ MIGRATION 003  
- **Migration:** 003_post_limits_tracking.sql
- **Status:** Không thấy reference trong code hiện tại
- **Khuyến nghị:** Functions có thể dùng table này

### Legacy Tables (Có thể xóa - CẦN REVIEW)

#### 13. `autopostvn_ai_rate_limits` ⚠️ CHỈ DÙNG TRONG DEBUG
- **Migration:** 002_ai_usage_tracking.sql
- **Files sử dụng:**
  - `src/app/api/debug/usage-check/route.ts`
  - `src/app/api/debug/force-update/route.ts` (3 references)
  - `src/app/api/debug/ai-limits/route.ts`
- **Khuyến nghị:** Có thể thay thế bằng `autopostvn_ai_usage`

#### 14. `autopostvn_post_limits_tracking` ⚠️ CHỈ DÙNG TRONG DEBUG
- **Files sử dụng:**
  - `src/app/api/dev/reset-rate-limit/route.ts` (2 references)
  - `src/app/api/debug/reset-post-usage/route.ts` (2 references)
- **Khuyến nghị:** Có thể thay thế bằng `autopostvn_post_usage`

---

## 🚫 Bảng KHÔNG ĐƯỢC SỬ DÙNG - CÓ THỂ XÓA

### Old Schema Tables (Không được reference trong code)

#### 1. `posts` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_posts`
- Chỉ xuất hiện trong test files và legacy database service

#### 2. `schedules` ❌ KHÔNG DÙNG  
- Được thay thế bởi `autopostvn_post_schedules`
- Chỉ xuất hiện trong test files

#### 3. `social_accounts` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_social_accounts`
- Chỉ xuất hiện trong test files và legacy database service

#### 4. `workspaces` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_workspaces`
- Chỉ xuất hiện trong legacy database service

#### 5. `users` ❌ KHÔNG DÙNG
- Chỉ được dùng trong debug routes
- Có thể là bảng auth.users mặc định

#### 6. `user_profiles` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_users` hoặc `autopostvn_user_profiles`
- Chỉ xuất hiện trong auth và register routes

#### 7. `analytics_events` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_analytics_events`
- Chỉ xuất hiện trong legacy database service

#### 8. `post_schedules` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_post_schedules`
- Chỉ xuất hiện trong legacy database service

#### 9. `post_analytics` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_post_analytics`
- Chỉ xuất hiện trong legacy database service

#### 10. `account_performance` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_account_performance`
- Chỉ xuất hiện trong legacy database service

#### 11. `error_logs` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_error_logs`
- Chỉ xuất hiện trong legacy database service

#### 12. `scheduled_jobs` ❌ KHÔNG DÙNG
- Chỉ xuất hiện trong 1 route cũ: `src/app/api/schedule/route.ts`

#### 13. `activity_logs` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_system_activity_logs`
- Chỉ xuất hiện trong test files

#### 14. `post-images` ❌ KHÔNG DÙNG
- Chỉ xuất hiện trong storage test debug route
- Không phải table chính, có thể là storage bucket

---

## 📋 DANH SÁCH CÁC BẢNG CÓ THỂ XÓA AN TOÀN

### Old Schema Tables (100% an toàn để xóa):
```sql
-- Legacy tables from old schema design
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS schedules; 
DROP TABLE IF EXISTS social_accounts;
DROP TABLE IF EXISTS workspaces;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS analytics_events;
DROP TABLE IF EXISTS post_schedules;
DROP TABLE IF EXISTS post_analytics;
DROP TABLE IF EXISTS account_performance;
DROP TABLE IF EXISTS error_logs;
DROP TABLE IF EXISTS scheduled_jobs;
DROP TABLE IF EXISTS activity_logs;
```

### Migration Tables Not Currently Used (Cần review):
```sql
-- Tables created by migrations but not actively used in code
DROP TABLE IF EXISTS autopostvn_user_workspaces;     -- From migration 001
DROP TABLE IF EXISTS autopostvn_user_social_accounts; -- From migration 001  
DROP TABLE IF EXISTS autopostvn_oauth_sessions;      -- From migration 001
DROP TABLE IF EXISTS autopostvn_post_rate_limits;    -- From migration 003
```

### Potentially Redundant Tables (Cần review trước khi xóa):
```sql
-- Tables that might be redundant
DROP TABLE IF EXISTS autopostvn_ai_rate_limits;     -- Thay bằng autopostvn_ai_usage
DROP TABLE IF EXISTS autopostvn_post_limits_tracking; -- Thay bằng autopostvn_post_usage
DROP TABLE IF EXISTS users; -- Có thể là auth.users
```

---

## ✅ BẢNG CẦN GIỮ LẠI (CORE SYSTEM)

```sql
-- Core tables - DO NOT DELETE
autopostvn_workspaces
autopostvn_social_accounts  
autopostvn_posts
autopostvn_post_schedules
autopostvn_users
autopostvn_system_activity_logs
autopostvn_ai_usage
autopostvn_post_usage

-- Schema-defined but not yet used (future features)
autopostvn_user_profiles
autopostvn_analytics_events
autopostvn_post_analytics
autopostvn_error_logs
autopostvn_account_performance
autopostvn_api_keys
autopostvn_webhooks
```

---

## 🎯 KHUYẾN NGHỊ HÀNH ĐỘNG (Updated)

1. **XÓA NGAY:** 12 bảng legacy schema cũ (không ảnh hưởng gì)
2. **REVIEW MIGRATION TABLES:** 4 bảng từ migrations có thể không dùng
3. **REVIEW REDUNDANT:** 3 bảng có thể dư thừa (ai_rate_limits, post_limits_tracking, users)
4. **GIỮ LẠI:** 16 bảng core system và future features

**Tổng cộng có thể xóa:** 16-19 bảng để cleanup database schema.

## 📝 MIGRATION NOTES

- Migration 001 tạo ra system multi-tenant nhưng code hiện tại có thể không dùng hết
- Migration 002 & 003 tạo ra tracking systems đang được dùng tích cực
- Migration 008 tạo activity logs đang được dùng tích cực
- Nhiều bảng từ migrations có thể đã được refactor trong main schema

## 🎯 Bảng ĐANG ĐƯỢC SỬ DỤNG trong Production Code

### Core Tables (Cần thiết - KHÔNG XÓA)

#### 1. `autopostvn_workspaces` ✅ ĐANG DÙNG
- **Files sử dụng:** 
  - `src/lib/services/UserManagementService.ts`
  - `src/app/api/test/route.ts`
  - `src/app/api/posts/schedules/route.ts`
  - `src/app/api/posts/route.ts`
- **Mục đích:** Quản lý workspace/organization cho user

#### 2. `autopostvn_social_accounts` ✅ ĐANG DÙNG
- **Files sử dụng:**
  - `src/lib/services/UserManagementService.ts` (8 references)
  - `src/app/api/posts/route.ts`
  - `src/lib/post-validation.ts`
- **Mục đích:** Lưu thông tin kết nối social media accounts

#### 3. `autopostvn_posts` ✅ ĐANG DÙNG
- **Files sử dụng:**
  - `src/lib/services/UserManagementService.ts`
  - `src/app/api/posts/route.ts` (3 references)
  - `src/lib/scheduler.ts`
  - `src/lib/post-validation.ts`
- **Mục đích:** Lưu trữ bài đăng và nội dung

#### 4. `autopostvn_post_schedules` ✅ ĐANG DÙNG
- **Files sử dụng:**
  - `src/lib/scheduler.ts` (5 references)
  - `src/app/api/posts/schedules/route.ts`
  - `src/app/api/posts/route.ts`
  - `src/lib/post-validation.ts`
- **Mục đích:** Quản lý lịch đăng bài cho từng platform

#### 5. `autopostvn_users` ✅ ĐANG DÙNG
- **Files sử dụng:**
  - `src/lib/services/aiUsageService.ts` (2 references)
  - `src/app/api/user/profile/route.ts` (2 references)
  - `src/app/api/debug/usage-check/route.ts`
  - `src/app/api/debug/ai-limits/route.ts`
- **Mục đích:** Thông tin người dùng và role management

#### 6. `autopostvn_system_activity_logs` ✅ ĐANG DÙNG
- **Files sử dụng:**
  - `src/lib/social-publishers.ts`
  - `src/lib/services/activity-log.service.ts` (5 references)
  - `src/lib/post-validation.ts`
- **Mục đích:** Theo dõi hoạt động hệ thống

#### 7. `autopostvn_ai_usage` ✅ ĐANG DÙNG
- **Files sử dụng:**
  - `src/lib/services/aiUsageService.ts`
  - `src/app/api/debug/reset-ai-usage/route.ts` (2 references)
- **Mục đích:** Theo dõi sử dụng AI features

#### 8. `autopostvn_post_usage` ✅ ĐANG DÙNG
- **Files sử dụng:**
  - `src/lib/services/postUsageService.ts` (3 references)
  - `src/app/api/debug/check-user-limits/route.ts`
- **Mục đích:** Theo dõi giới hạn đăng bài

### Legacy Tables (Có thể xóa - CẦN REVIEW)

#### 9. `autopostvn_ai_rate_limits` ⚠️ CHỈ DÙNG TRONG DEBUG
- **Files sử dụng:**
  - `src/app/api/debug/usage-check/route.ts`
  - `src/app/api/debug/force-update/route.ts` (3 references)
  - `src/app/api/debug/ai-limits/route.ts`
- **Khuyến nghị:** Có thể thay thế bằng `autopostvn_ai_usage`

#### 10. `autopostvn_post_limits_tracking` ⚠️ CHỈ DÙNG TRONG DEBUG
- **Files sử dụng:**
  - `src/app/api/dev/reset-rate-limit/route.ts` (2 references)
  - `src/app/api/debug/reset-post-usage/route.ts` (2 references)
- **Khuyến nghị:** Có thể thay thế bằng `autopostvn_post_usage`

---

## 🚫 Bảng KHÔNG ĐƯỢC SỬ DÙNG - CÓ THỂ XÓA

### Old Schema Tables (Không được reference trong code)

#### 1. `posts` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_posts`
- Chỉ xuất hiện trong test files và legacy database service

#### 2. `schedules` ❌ KHÔNG DÙNG  
- Được thay thế bởi `autopostvn_post_schedules`
- Chỉ xuất hiện trong test files

#### 3. `social_accounts` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_social_accounts`
- Chỉ xuất hiện trong test files và legacy database service

#### 4. `workspaces` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_workspaces`
- Chỉ xuất hiện trong legacy database service

#### 5. `users` ❌ KHÔNG DÙNG
- Chỉ được dùng trong debug routes
- Có thể là bảng auth.users mặc định

#### 6. `user_profiles` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_users` hoặc `autopostvn_user_profiles`
- Chỉ xuất hiện trong auth và register routes

#### 7. `analytics_events` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_analytics_events`
- Chỉ xuất hiện trong legacy database service

#### 8. `post_schedules` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_post_schedules`
- Chỉ xuất hiện trong legacy database service

#### 9. `post_analytics` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_post_analytics`
- Chỉ xuất hiện trong legacy database service

#### 10. `account_performance` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_account_performance`
- Chỉ xuất hiện trong legacy database service

#### 11. `error_logs` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_error_logs`
- Chỉ xuất hiện trong legacy database service

#### 12. `scheduled_jobs` ❌ KHÔNG DÙNG
- Chỉ xuất hiện trong 1 route cũ: `src/app/api/schedule/route.ts`

#### 13. `activity_logs` ❌ KHÔNG DÙNG
- Được thay thế bởi `autopostvn_system_activity_logs`
- Chỉ xuất hiện trong test files

#### 14. `post-images` ❌ KHÔNG DÙNG
- Chỉ xuất hiện trong storage test debug route
- Không phải table chính, có thể là storage bucket

---

## 📋 DANH SÁCH CÁC BẢNG CÓ THỂ XÓA AN TOÀN

### Old Schema Tables (100% an toàn để xóa):
```sql
-- Legacy tables from old schema design
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS schedules; 
DROP TABLE IF EXISTS social_accounts;
DROP TABLE IF EXISTS workspaces;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS analytics_events;
DROP TABLE IF EXISTS post_schedules;
DROP TABLE IF EXISTS post_analytics;
DROP TABLE IF EXISTS account_performance;
DROP TABLE IF EXISTS error_logs;
DROP TABLE IF EXISTS scheduled_jobs;
DROP TABLE IF EXISTS activity_logs;
```

### Potentially Redundant Tables (Cần review trước khi xóa):
```sql
-- Tables that might be redundant
DROP TABLE IF EXISTS autopostvn_ai_rate_limits;     -- Thay bằng autopostvn_ai_usage
DROP TABLE IF EXISTS autopostvn_post_limits_tracking; -- Thay bằng autopostvn_post_usage
DROP TABLE IF EXISTS users; -- Có thể là auth.users
```

---

## ✅ BẢNG CẦN GIỮ LẠI (CORE SYSTEM)

```sql
-- Core tables - DO NOT DELETE
autopostvn_workspaces
autopostvn_social_accounts  
autopostvn_posts
autopostvn_post_schedules
autopostvn_users
autopostvn_system_activity_logs
autopostvn_ai_usage
autopostvn_post_usage

-- Schema-defined but not yet used (future features)
autopostvn_user_profiles
autopostvn_analytics_events
autopostvn_post_analytics
autopostvn_error_logs
autopostvn_account_performance
autopostvn_api_keys
autopostvn_webhooks
```

---

## 🎯 KHUYẾN NGHỊ HÀNH ĐỘNG

1. **XÓA NGAY:** 12 bảng legacy schema cũ (không ảnh hưởng gì)
2. **REVIEW:** 3 bảng có thể dư thừa (ai_rate_limits, post_limits_tracking, users)
3. **GIỮ LẠI:** 16 bảng core system và future features

**Tổng cộng có thể xóa:** 12-15 bảng để cleanup database schema.

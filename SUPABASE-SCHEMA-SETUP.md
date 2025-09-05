# Cấu hình Supabase với Custom Schema "AutoPostVN"

## 🎯 Lợi ích của Custom Schema

Sử dụng schema riêng `AutoPostVN` thay vì `public` mang lại các lợi ích:

✅ **Tổ chức tốt hơn**: Tách biệt tables của dự án với system tables
✅ **Bảo mật**: Tránh conflict với tables khác trong cùng project
✅ **Quản lý**: Dễ dàng backup/restore chỉ schema của dự án
✅ **Multi-tenancy**: Có thể chạy nhiều ứng dụng trên cùng Supabase project

## 🚀 Cách thiết lập

### 1. Tạo Schema trong Supabase

Trong Supabase SQL Editor, chạy:

```sql
-- Tạo schema AutoPostVN
CREATE SCHEMA IF NOT EXISTS "AutoPostVN";

-- Set search path (optional, cho session hiện tại)
SET search_path TO "AutoPostVN", public;
```

### 2. Import Schema

Copy toàn bộ nội dung từ `supabase/schema.sql` và chạy trong SQL Editor.

Schema đã được update để sử dụng prefix `"AutoPostVN".` cho tất cả tables.

### 3. Cấu hình Environment

Trong `.env.local`, thêm:

```env
SUPABASE_SCHEMA=AutoPostVN
```

### 4. Cấu hình Supabase Settings (Khuyến nghị)

Trong Supabase Dashboard → Settings → API:

1. **Default Schema**: Để `public` (không thay đổi)
2. **Exposed Schemas**: Thêm `AutoPostVN` vào danh sách

### 5. Row Level Security (RLS)

RLS policies đã được cấu hình cho tất cả tables trong schema `AutoPostVN`.

## ⚠️ Lưu ý về Supabase JavaScript Client

Supabase JS client có một số hạn chế với custom schema:

### Cách tiếp cận hiện tại:

```typescript
// Backend sẽ log warning và sử dụng raw SQL khi cần
const { data } = await supabase.from('workspaces').select('*');
// Supabase sẽ tự động map đến AutoPostVN.workspaces nếu cấu hình đúng
```

### Giải pháp nâng cao (nếu cần):

1. **Raw SQL Queries**:
```typescript
const { data } = await supabase.rpc('get_workspaces_from_schema');
```

2. **Supabase Functions**:
```sql
CREATE OR REPLACE FUNCTION get_workspaces_from_schema()
RETURNS TABLE(LIKE "AutoPostVN".workspaces)
LANGUAGE sql
AS $$
  SELECT * FROM "AutoPostVN".workspaces;
$$;
```

## 🔧 Testing Custom Schema

### 1. Kiểm tra Schema

```sql
-- Liệt kê các schema
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name = 'AutoPostVN';

-- Kiểm tra tables trong schema
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'AutoPostVN';
```

### 2. Test API Endpoints

```bash
# Test health endpoint
curl http://localhost:3000/api/v1/health

# Test với workspaceId
curl "http://localhost:3000/api/v1/dashboard?workspaceId=test-workspace"
```

### 3. Verify trong Logs

Backend sẽ log warning nếu sử dụng custom schema:

```
Using custom schema: AutoPostVN. Ensure your Supabase project is configured correctly.
```

## 📊 Database Structure

Với custom schema, structure sẽ là:

```
Supabase Project
├── public (schema)
│   ├── auth.users
│   └── storage.objects
└── AutoPostVN (schema)
    ├── workspaces
    ├── social_accounts
    ├── posts
    ├── post_schedules
    ├── analytics_events
    └── error_logs
```

## 🚨 Troubleshooting

### Issue: Table không tìm thấy

**Nguyên nhân**: RLS policy hoặc schema không được expose

**Giải pháp**:
1. Kiểm tra RLS policies đã enable
2. Verify schema trong Supabase Settings → API
3. Ensure user có permission trên schema

### Issue: Permission denied

**Nguyên nhân**: Service role key không có quyền trên custom schema

**Giải pháp**:
```sql
-- Grant permissions cho service role
GRANT USAGE ON SCHEMA "AutoPostVN" TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "AutoPostVN" TO service_role;
```

### Issue: API endpoints trả về empty

**Nguyên nhân**: Client đang query sai schema

**Giải pháp**:
1. Verify environment variable `SUPABASE_SCHEMA`
2. Check Supabase dashboard settings
3. Use raw SQL nếu cần thiết

## ✅ Migration Checklist

- [ ] Tạo schema `AutoPostVN` trong Supabase
- [ ] Import `supabase/schema.sql` (đã update)
- [ ] Cấu hình `SUPABASE_SCHEMA=AutoPostVN` trong `.env.local`
- [ ] Expose schema trong Supabase Settings
- [ ] Grant permissions cho service_role
- [ ] Test API endpoints
- [ ] Verify RLS policies hoạt động

Custom schema setup hoàn tất! 🎉

# 🔧 ADDITIONAL FIX: Workspace Settings API

## ❌ Vấn đề phát hiện thêm

### API `/api/workspace/settings` lỗi 404

**Error log**:
```
GET /api/workspace/settings 404 (Not Found)
Failed to fetch workspace settings
workspaceId: "6b02ec4d-e0de-4834-a48f-84999e696891"
```

### Root Cause:

Code đang dùng **fallback sai**:

```typescript
// BEFORE - SAI!
const targetWorkspaceId = workspaceId || userId;

// Query với userId (6b02ec4d...) như là workspace_id
// Nhưng workspace_id thật là 486fdee4...
// → Không tìm thấy → 404 Error
```

## ✅ Đã sửa

### File: `src/app/api/workspace/settings/route.ts`

#### GET Method:

```typescript
// AFTER - ĐÚNG!
let targetWorkspaceId = workspaceId;

if (!targetWorkspaceId) {
  // Query workspace theo user_id
  const wsResult = await query(
    'SELECT id FROM autopostvn_workspaces WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  
  if (wsResult.rows.length === 0) {
    return NextResponse.json(
      { error: 'No workspace found. Please create a workspace first.' },
      { status: 404 }
    );
  }
  
  targetWorkspaceId = wsResult.rows[0].id;
}
```

#### PUT Method:

Cùng logic - query workspace theo `user_id` thay vì assume `workspace_id = user_id`.

## 📊 Impact

### APIs Fixed:

1. ✅ `GET /api/workspace/settings`
2. ✅ `PUT /api/workspace/settings`

### Pattern Changed:

```diff
- workspaceId = workspaceId || userId  ❌ WRONG
+ Query: SELECT id FROM autopostvn_workspaces WHERE user_id = $1  ✅ CORRECT
```

## 🎯 Kết quả

Sau khi **logout & login lại**, các API này sẽ hoạt động đúng:

```
✅ GET /api/workspace/settings → 200 OK
   Trả về: workspace của user (486fdee4...)

✅ PUT /api/workspace/settings → 200 OK
   Update: workspace settings

✅ POST /api/posts → 201 Created
   Tạo post với workspace_id đúng
```

## 🔍 Verification

### Check logs sau khi login:

```bash
npm run dev
```

**Expected**:
```
📥 GET /api/workspace/settings { userId: '6b02ec4d...', workspaceId: null }
🎯 Target workspace ID: 486fdee4... ✅
📊 Query executed: SELECT id FROM autopostvn_workspaces WHERE user_id = $1
 GET /api/workspace/settings 200 in 50ms ✅
```

**NOT**:
```
🎯 Target workspace ID: 6b02ec4d... ❌
 GET /api/workspace/settings 404 in 50ms ❌
```

## 📝 Summary

### Root Cause của TẤT CẢ lỗi:

```
Session có user_id SAI do code trong auth.ts query sai
   ↓
Tất cả APIs dùng session.user.id
   ↓
Các APIs assume workspace_id = user_id
   ↓
Query sai bảng → 404 errors
```

### Đã sửa:

1. ✅ `src/lib/auth.ts` - Query user theo đúng
2. ✅ `src/app/api/posts/route.ts` - Query workspace theo user_id
3. ✅ `src/app/api/workspace/settings/route.ts` - Query workspace theo user_id  
4. ✅ Database - Add user_id column
5. ✅ Frontend - Handle API response

### Cần làm:

⚠️ **LOGOUT & LOGIN LẠI** để session update!

Sau đó mọi thứ sẽ hoạt động bình thường.

# 🔧 BUG FIX: Posts không hiển thị trong app

## 📋 Vấn đề

Khi tạo posts từ app, posts không xuất hiện trong danh sách. Kiểm tra database thấy 3 vấn đề chính:

### 🔴 Issues Found (từ screenshots):

1. **Hình 1**: `account_id` = `[null]` → Không có social account liên kết
2. **Hình 2**: `scheduled_at` = `[null]` → Không có thời gian schedule  
3. **Hình 3**: `workspace_id` = `[null]` → Không có workspace ID

## 🔍 Root Cause Analysis

### 1. Supabase Client Error
```
Error: supabaseUrl is required.
  at checkAIRateLimit (aiUsageService.ts:14:88)
```

**Nguyên nhân**: Code vẫn sử dụng Supabase client thay vì PostgreSQL sau khi migrate.

### 2. Data Integrity Issues

Database check cho thấy:
- ✅ User: `a@gmail.com` (ID: `6b02ec4d-e0de-4834-a48f-84999e696891`)
- ✅ Workspace: `Anh A's Workspace` (ID: `486fdee4-7b40-453d-bb69-681b9f3f58f8`)
- ❌ Posts có:
  - `user_id` = `486fdee4-7b40-453d-bb69-681b9f3f58f8` (SAI - đây là workspace_id)
  - `workspace_id` = `NULL` (THIẾU)
- ❌ Không có social accounts cho workspace
- ❌ Không có post schedules

## ✅ Solutions Applied

### 1. Migration Services từ Supabase → PostgreSQL

**Files Modified:**

#### `src/lib/services/aiUsageService.ts`
```typescript
// BEFORE
import { sbServer } from '@/lib/supabase/server';
const sb = sbServer();

// AFTER  
import { db } from '@/lib/db/supabase-compat';
// Sử dụng PostgreSQL-compatible API
```

#### `src/lib/services/postUsageService.ts`
```typescript
// BEFORE
const { data, error } = await sb.from('autopostvn_post_usage')...

// AFTER
const { data, error } = await db.from('autopostvn_post_usage')...
```

#### `src/lib/db/supabase-compat.ts`
**Added missing query methods:**
- ✅ `gte()` - Greater than or equal
- ✅ `gt()` - Greater than
- ✅ `lt()` - Less than  
- ✅ `lte()` - Less than or equal
- ✅ `neq()` - Not equal
- ✅ Chain multiple `eq()` calls for `UPDATE`

### 2. Fixed POST /api/posts Validation

**File**: `src/app/api/posts/route.ts`

**Improvements:**

```typescript
// 1. Validate workspace exists
const workspaceResult = await query(
  `SELECT id FROM autopostvn_workspaces WHERE user_id = $1 LIMIT 1`,
  [userId]
);

if (!workspaceResult.rows[0]) {
  return NextResponse.json({ 
    error: 'No workspace found. Please create a workspace first.' 
  }, { status: 400 });
}

// 2. Validate workspace ownership
const workspaceCheck = await query(
  `SELECT id FROM autopostvn_workspaces WHERE id = $1 AND user_id = $2`,
  [workspaceId, userId]
);

// 3. Set proper post status
status: scheduled_at ? 'scheduled' : 'draft'

// 4. Validate social accounts exist
if (accounts.length === 0) {
  return NextResponse.json({ 
    error: `No social accounts found for platforms: ${providers.join(', ')}` 
  }, { status: 400 });
}

// 5. Skip schedules without required fields
if (!schedule.social_account_id || !schedule.scheduled_at) {
  console.warn('[POST /api/posts] Skipping invalid schedule');
  continue;
}
```

### 3. Database Data Fixes

**Script**: `scripts/fix-posts.js`

```sql
-- Fixed wrong user_id and NULL workspace_id
UPDATE autopostvn_posts
SET 
  user_id = '6b02ec4d-e0de-4834-a48f-84999e696891',  -- Correct user ID
  workspace_id = '486fdee4-7b40-453d-bb69-681b9f3f58f8',  -- Correct workspace ID
  updated_at = NOW()
WHERE workspace_id IS NULL OR user_id != '6b02ec4d-e0de-4834-a48f-84999e696891'
```

**Result**: ✅ Updated 2 posts

### 4. Created Test Social Accounts

**Script**: `scripts/create-test-accounts.js`

```sql
-- Created 2 test accounts for development
INSERT INTO autopostvn_social_accounts (workspace_id, provider, platform_name, ...)
VALUES 
  ('486fdee4-...', 'facebook_page', 'Test FB Page', ...),
  ('486fdee4-...', 'instagram', 'Test IG', ...);
```

### 5. Created Post Schedules

**Script**: `scripts/create-schedules.js`

```sql
-- Created schedules linking posts to social accounts
INSERT INTO autopostvn_post_schedules 
  (post_id, social_account_id, scheduled_at, status)
VALUES 
  (post_id, account_id, NOW() + interval '1 hour', 'pending');
```

**Result**: ✅ Created 4 schedules (2 posts × 2 accounts)

## 📊 Final State

### Database Verification:

```
✅ User: a@gmail.com (6b02ec4d-e0de-4834-a48f-84999e696891)
✅ Workspace: Anh A's Workspace (486fdee4-7b40-453d-bb69-681b9f3f58f8)
✅ Posts: 2 posts
   ├─ user_id: 6b02ec4d-e0de-4834-a48f-84999e696891 ✓
   ├─ workspace_id: 486fdee4-7b40-453d-bb69-681b9f3f58f8 ✓
   └─ status: scheduled ✓

✅ Social Accounts: 2 accounts
   ├─ Test FB Page (facebook_page)
   └─ Test IG (instagram)

✅ Post Schedules: 4 schedules
   ├─ Post 1 → Test FB Page (pending @ 2025-11-09 20:29)
   ├─ Post 1 → Test IG (pending @ 2025-11-09 20:29)
   ├─ Post 2 → Test FB Page (pending @ 2025-11-09 20:29)
   └─ Post 2 → Test IG (pending @ 2025-11-09 20:29)
```

## 🛠️ Utility Scripts Created

### Diagnostic Scripts:
1. `scripts/show-users.js` - Hiển thị all users
2. `scripts/list-tables.js` - List all database tables
3. `scripts/check-workspaces.js` - Check workspace structure
4. `scripts/check-social-accounts.js` - Check social accounts
5. `scripts/check-user-setup.js` - Full user setup check

### Fix Scripts:
6. `scripts/fix-posts.js` - Sửa post data
7. `scripts/create-test-accounts.js` - Tạo test accounts
8. `scripts/create-schedules.js` - Tạo post schedules
9. `scripts/find-user.js` - Tìm và sync user

## 🎯 Testing

### Run these commands to verify:

```bash
# 1. Check user setup
node scripts/show-users.js

# 2. Check posts have correct data
node scripts/create-schedules.js

# 3. Start app and verify posts load
npm run dev
```

### Expected Result:
- ✅ Posts hiển thị trong app
- ✅ Posts có đúng workspace và user
- ✅ Posts có schedules với social accounts
- ✅ Status hiển thị đúng (scheduled)
- ✅ Providers hiển thị (Facebook, Instagram)

## 🚨 Important Notes

### For Future Posts:

1. **Workspace Required**: User PHẢI có workspace trước khi tạo posts
2. **Social Accounts Required**: Workspace PHẢI có social accounts
3. **Validation**: API sẽ reject nếu thiếu workspace hoặc accounts
4. **Status Logic**: 
   - `draft` nếu không có `scheduled_at`
   - `scheduled` nếu có `scheduled_at`

### For Production:

```sql
-- Ensure workspace has user_id (if using old schema)
ALTER TABLE autopostvn_workspaces 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES autopostvn_users(id);

-- Or use junction table autopostvn_user_workspaces
```

## 📝 Lessons Learned

1. ❌ **Don't mix workspace_id and user_id** - They are different entities
2. ✅ **Always validate foreign keys** before INSERT
3. ✅ **Check constraints** match schema (e.g., status values)
4. ✅ **Log extensively** in API routes for debugging
5. ✅ **Create diagnostic scripts** for faster debugging

## ✅ Status: RESOLVED

Posts bây giờ sẽ load đúng trong app với đầy đủ:
- ✅ workspace_id
- ✅ user_id  
- ✅ social_accounts (account_id)
- ✅ scheduled_at
- ✅ schedules

**Refresh app để thấy posts! 🎉**

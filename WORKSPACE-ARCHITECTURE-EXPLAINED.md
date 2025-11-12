# 🏢 Giải thích về 2 bảng Workspace

## 🤔 Tại sao có 2 bảng?

### 1️⃣ `autopostvn_workspaces` (Bảng chính - Schema gốc)
```sql
CREATE TABLE autopostvn_workspaces (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  settings JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
  -- ❌ KHÔNG CÓ user_id
);
```

**Mục đích**: Workspace là một entity độc lập, có thể có nhiều members
- Thiết kế cho **multi-user workspace** (team collaboration)
- Một workspace có thể có nhiều users (qua junction table)
- Một user có thể thuộc nhiều workspaces

### 2️⃣ `autopostvn_user_workspaces` (Migration - User-specific)
```sql
CREATE TABLE autopostvn_user_workspaces (
  id UUID PRIMARY KEY,
  user_email VARCHAR(255) UNIQUE NOT NULL,
  workspace_name VARCHAR(255) NOT NULL,
  settings JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Mục đích**: Personal workspace cho mỗi user
- Thiết kế cho **single-user workspace** (1 user = 1 workspace)
- Migration từ kiến trúc cũ
- Dùng `user_email` thay vì UUID

## ⚠️ VẤN ĐỀ HIỆN TẠI

### Conflict giữa 2 kiến trúc:

```
Schema gốc (Supabase):
  autopostvn_workspaces (multi-user)
     ↓
  autopostvn_posts.workspace_id → workspaces.id
     ↓
  autopostvn_social_accounts.workspace_id → workspaces.id

Migration mới:
  autopostvn_user_workspaces (single-user)
     ↓
  autopostvn_user_social_accounts.workspace_id → user_workspaces.id
```

**Kết quả**: App không biết dùng table nào! 🤯

## ✅ GIẢI PHÁP

### Option 1: Thống nhất dùng `autopostvn_workspaces` + thêm user_id

**Recommended** - Đơn giản và phù hợp với schema hiện tại:

```sql
-- Add user_id column to main workspace table
ALTER TABLE autopostvn_workspaces 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES autopostvn_users(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id 
ON autopostvn_workspaces(user_id);

-- Migrate data from user_workspaces (if any)
INSERT INTO autopostvn_workspaces (user_id, name, slug, settings, created_at, updated_at)
SELECT 
  u.id,
  uw.workspace_name,
  LOWER(REPLACE(uw.user_email, '@', '-')),
  uw.settings,
  uw.created_at,
  uw.updated_at
FROM autopostvn_user_workspaces uw
JOIN autopostvn_users u ON u.email = uw.user_email
ON CONFLICT (slug) DO NOTHING;

-- Drop old table (after verification)
-- DROP TABLE autopostvn_user_workspaces CASCADE;
```

**Benefits**:
- ✅ Tất cả code đều dùng 1 table
- ✅ Hỗ trợ cả single-user và multi-user
- ✅ Không cần refactor nhiều
- ✅ Foreign keys vẫn valid

### Option 2: Dùng Junction Table (Team collaboration)

**For future** - Khi cần nhiều users/workspace:

```sql
-- Keep autopostvn_workspaces as-is (no user_id)

-- Create workspace_members junction table
CREATE TABLE autopostvn_workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES autopostvn_workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES autopostvn_users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);
```

## 🔧 IMPLEMENTATION PLAN

### Step 1: Add user_id to workspaces (IMMEDIATE)

Tạo migration file:

```sql
-- migrations/add_user_id_to_workspaces.sql
ALTER TABLE autopostvn_workspaces 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES autopostvn_users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_workspaces_user_id 
ON autopostvn_workspaces(user_id);

-- Update existing workspaces
UPDATE autopostvn_workspaces w
SET user_id = (
  SELECT u.id 
  FROM autopostvn_users u 
  WHERE w.slug LIKE 'user-%' || SUBSTRING(u.id::TEXT, 1, 8)
  LIMIT 1
)
WHERE user_id IS NULL;
```

### Step 2: Update API code

```typescript
// src/app/api/posts/route.ts
const workspaceResult = await query(
  `SELECT id FROM autopostvn_workspaces WHERE user_id = $1 LIMIT 1`,
  [userId]
);

// Create workspace if not exists
if (!workspaceResult.rows[0]) {
  const newWorkspace = await query(
    `INSERT INTO autopostvn_workspaces (user_id, name, slug)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, `User ${userId.substring(0,8)} Workspace`, `user-${userId.substring(0,8)}`]
  );
  workspaceId = newWorkspace.rows[0].id;
}
```

### Step 3: Deprecate user_workspaces

```typescript
// Add warning to old table
COMMENT ON TABLE autopostvn_user_workspaces IS 
'DEPRECATED: Use autopostvn_workspaces with user_id instead';
```

## 📊 COMPARISON

| Feature | autopostvn_workspaces | autopostvn_user_workspaces |
|---------|----------------------|---------------------------|
| Schema | ✅ Supabase gốc | ❌ Migration thêm |
| Multi-user | ✅ Có (với junction) | ❌ Không (1:1) |
| Current usage | ✅ Posts, Accounts | ❌ Không dùng |
| Has user_id | ⚠️ Cần thêm | ✅ Có (user_email) |
| Recommend | ✅ **USE THIS** | ❌ Deprecate |

## 🎯 ACTION ITEMS

1. ✅ **Chạy migration** add `user_id` to `autopostvn_workspaces`
2. ✅ **Update API** để query theo `user_id`
3. ✅ **Verify** tất cả posts có `workspace_id` valid
4. ⚠️ **Deprecate** `autopostvn_user_workspaces` (không xóa ngay)
5. 📝 **Document** workspace architecture

## 💡 BEST PRACTICES

### Luôn luôn:

```typescript
// ✅ GOOD: Query workspace by user_id
const workspace = await query(
  'SELECT * FROM autopostvn_workspaces WHERE user_id = $1',
  [userId]
);

// ❌ BAD: Assume workspace_id = user_id
const workspace = await query(
  'SELECT * FROM autopostvn_workspaces WHERE id = $1',
  [userId] // WRONG!
);
```

### Khi tạo workspace:

```typescript
// ✅ GOOD: Set user_id
await query(
  'INSERT INTO autopostvn_workspaces (user_id, name, slug) VALUES ($1, $2, $3)',
  [userId, name, slug]
);

// ❌ BAD: No user_id
await query(
  'INSERT INTO autopostvn_workspaces (name, slug) VALUES ($1, $2)',
  [name, slug] // Missing user relationship!
);
```

## 🚨 TL;DR

- **2 tables tồn tại** vì có conflict giữa schema gốc và migration
- **Giải pháp**: Add `user_id` vào `autopostvn_workspaces` 
- **Deprecate**: `autopostvn_user_workspaces` (không dùng nữa)
- **Update**: Tất cả code phải query workspace theo `user_id`

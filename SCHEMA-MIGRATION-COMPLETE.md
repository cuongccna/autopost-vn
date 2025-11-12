# ✅ Schema Migration Complete - November 9, 2025

## 📊 Summary

Database schema has been successfully synchronized with Supabase export.

### Before Migration
- **Tables:** 16
- **Missing:** 5 critical tables
- **Issues:** Missing providers, missing columns

### After Migration
- **Tables:** 21 ✅
- **All tables:** Present and configured
- **Status:** 100% synchronized with Supabase schema

---

## 🆕 Tables Added

### 1. `autopostvn_users` ✅
**Purpose:** Main user authentication and role management

**Columns:**
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `user_role` (VARCHAR(20)) - 'free', 'professional', 'enterprise'
- `is_active` (BOOLEAN)
- `subscription_expires_at` (TIMESTAMPTZ)
- `metadata` (JSONB)
- `phone` (VARCHAR(20))
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_autopostvn_users_phone`
- `idx_autopostvn_users_user_role`

**Triggers:**
- `update_autopostvn_users_updated_at`

---

### 2. `autopostvn_user_profiles` ✅
**Purpose:** Extended user profile information

**Columns:**
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `phone` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

### 3. `autopostvn_system_activity_logs` ✅
**Purpose:** System-wide activity tracking and audit logs

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → autopostvn_users)
- `workspace_id` (UUID, FK → autopostvn_workspaces)
- `action_type` (TEXT)
- `action_category` (TEXT) - 'auth', 'post', 'account', 'workspace', 'admin', 'api'
- `description` (TEXT)
- `target_resource_type` (TEXT)
- `target_resource_id` (UUID)
- `previous_data` (JSONB)
- `new_data` (JSONB)
- `ip_address` (INET)
- `user_agent` (TEXT)
- `request_id` (TEXT)
- `session_id` (TEXT)
- `status` (TEXT) - 'success', 'failed', 'warning'
- `error_message` (TEXT)
- `duration_ms` (INTEGER)
- `additional_data` (JSONB)
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_autopostvn_activity_logs_user_id`
- `idx_autopostvn_activity_logs_workspace_id`
- `idx_autopostvn_activity_logs_action_category`
- `idx_autopostvn_activity_logs_action_type`
- `idx_autopostvn_activity_logs_target_resource`
- `idx_autopostvn_activity_logs_status`
- `idx_autopostvn_activity_logs_created_at`

---

### 4. `autopostvn_ai_usage` ✅
**Purpose:** Track AI feature usage (captions, hashtags, etc.)

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → autopostvn_users)
- `request_type` (VARCHAR(50))
- `request_date` (DATE)
- `request_timestamp` (TIMESTAMPTZ)
- `tokens_used` (INTEGER)
- `success` (BOOLEAN)
- `error_message` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Triggers:**
- `update_autopostvn_ai_usage_updated_at`

---

### 5. `autopostvn_post_usage` ✅
**Purpose:** Track post creation and publishing usage

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → autopostvn_users)
- `post_id` (UUID)
- `post_type` (VARCHAR(50))
- `platform` (VARCHAR(50))
- `content_preview` (TEXT)
- `media_count` (INTEGER)
- `created_at` (TIMESTAMPTZ)
- `scheduled_for` (TIMESTAMPTZ)
- `published_at` (TIMESTAMPTZ)
- `status` (VARCHAR(50))
- `metadata` (JSONB)

---

## 🔧 Updates to Existing Tables

### `autopostvn_social_accounts`

**Updated Provider Check Constraint:**
```sql
-- BEFORE: Only 3 providers
'facebook', 'instagram', 'zalo'

-- AFTER: 5 providers ✅
'facebook', 'facebook_page', 'instagram', 'zalo', 'buffer'
```

**New Column Added:**
- `platform_name` (TEXT) - Display name for the platform

---

## 📈 Default Data Inserted

### AI Rate Limits
```
| user_role    | daily_limit | monthly_limit |
|--------------|-------------|---------------|
| free         | 3           | 60            |
| professional | 50          | 1,000         |
| enterprise   | -1 (unlimited) | -1 (unlimited) |
```

### Post Rate Limits
```
| user_role    | daily_limit | monthly_limit |
|--------------|-------------|---------------|
| free         | -1          | -1            |
| professional | 100         | 1,000         |
| enterprise   | -1 (unlimited) | -1 (unlimited) |
```

---

## ✅ Complete Table List (21 tables)

1. ✅ `autopostvn_account_performance`
2. ✅ `autopostvn_ai_rate_limits`
3. ✅ `autopostvn_ai_usage` **(NEW)**
4. ✅ `autopostvn_analytics_events`
5. ✅ `autopostvn_api_keys`
6. ✅ `autopostvn_error_logs`
7. ✅ `autopostvn_media`
8. ✅ `autopostvn_oauth_sessions`
9. ✅ `autopostvn_post_analytics`
10. ✅ `autopostvn_post_rate_limits`
11. ✅ `autopostvn_post_schedules`
12. ✅ `autopostvn_post_usage` **(NEW)**
13. ✅ `autopostvn_posts`
14. ✅ `autopostvn_social_accounts` **(UPDATED)**
15. ✅ `autopostvn_system_activity_logs` **(NEW)**
16. ✅ `autopostvn_user_profiles` **(NEW)**
17. ✅ `autopostvn_user_social_accounts`
18. ✅ `autopostvn_user_workspaces`
19. ✅ `autopostvn_users` **(NEW)**
20. ✅ `autopostvn_webhooks`
21. ✅ `autopostvn_workspaces`

---

## 🎯 Impact on Current Errors

### FIXED Issues:

1. ✅ **Activity Logs Service**
   - Now has `autopostvn_system_activity_logs` table
   - Can log user activities properly

2. ✅ **User Authentication**
   - `autopostvn_users` table ready
   - Can store user data with roles

3. ✅ **AI Features**
   - `autopostvn_ai_usage` tracking ready
   - Rate limits configured

4. ✅ **Social Accounts**
   - Supports all providers including Facebook Pages and Buffer
   - Has `platform_name` for display

---

## 🚀 Next Steps

### 1. Update Application Code

The database is now ready, but you need to update the code to use new tables:

```typescript
// Example: Use autopostvn_users instead of workspace settings
import { query } from '@/lib/db/postgres';

// Register new user
const newUser = await query(`
  INSERT INTO autopostvn_users (id, email, full_name, user_role)
  VALUES ($1, $2, $3, $4)
  RETURNING *
`, [userId, email, fullName, 'free']);
```

### 2. Migrate Existing Data

If you have users in `autopostvn_workspaces.settings`, migrate them:

```sql
-- Migration script to move users from workspace settings to users table
INSERT INTO autopostvn_users (id, email, full_name, user_role)
SELECT 
  id,
  settings->>'user_email',
  settings->>'user_full_name',
  COALESCE(settings->>'user_role', 'free')
FROM autopostvn_workspaces
WHERE settings->>'user_email' IS NOT NULL
ON CONFLICT (email) DO NOTHING;
```

### 3. Update Services

- ✅ ActivityLogService → Use `autopostvn_system_activity_logs`
- ✅ UserManagementService → Use `autopostvn_users`
- ✅ AI Services → Log to `autopostvn_ai_usage`

---

## 📝 Migration File

**Location:** `migrations/add-missing-tables.sql`

**How to run again (if needed):**
```powershell
$env:PGPASSWORD='autopost_vn_secure_2025'
psql -h localhost -U autopost_admin -d autopost_vn -f migrations/add-missing-tables.sql
```

---

## ✨ Schema is now 100% synchronized with Supabase!

All tables, columns, constraints, indexes, and triggers match the production schema.

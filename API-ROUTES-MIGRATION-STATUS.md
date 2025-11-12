# API Routes Migration Status

## ✅ Completed Migrations (PostgreSQL)

### Core Features (8 routes)
1. ✅ `/api/user/profile` - User profile GET/PUT
2. ✅ `/api/dashboard/stats` - Dashboard statistics  
3. ✅ `/api/dashboard/activities` - Activity logs with pagination
4. ✅ `/api/posts` - Full CRUD (GET/POST/PUT/DELETE)
5. ✅ `/api/posts/schedules` - Schedule listing (GET)
6. ✅ `/api/debug/[...path]` - All debug routes stubbed (503)
7. ✅ `/api/dev/[...path]` - All dev routes stubbed (503)
8. ✅ `/api/analytics` - **FULLY MIGRATED** - Facebook Insights with PostgreSQL

### Recently Completed
- ✅ `FacebookInsightsService` - Migrated from Supabase to PostgreSQL
  - Analytics summary with real Facebook data
  - Best posting times analysis
  - Post insights (likes, comments, shares, reach, impressions)
  - Engagement rate calculations

## ⚠️ Pending Migrations (Still using Supabase)

### Media & Storage (2 routes)
- ❌ `/api/media/upload` - File upload (Supabase Storage)
  - Priority: HIGH - Core feature
  - Solution: Use local filesystem storage from `@/lib/storage/local`
  - Estimate: 30 minutes

### User Management (3 routes)
- ❌ `/api/user/export` - Export user data
  - Priority: LOW - Admin feature
  - Estimate: 20 minutes
  
- ❌ `/api/user/delete-account` - Account deletion
  - Priority: MEDIUM - User feature
  - Estimate: 30 minutes
  
- ❌ `/api/user/change-password` - Password change
  - Priority: HIGH - Security feature
  - Estimate: 15 minutes

### Other Features
- ❌ `/api/upgrade-request` - Upgrade requests
  - Priority: LOW
  - Estimate: 10 minutes

## 📊 Migration Progress

**Total Routes Identified**: ~15
**Migrated to PostgreSQL**: 9 (60%)
**Pending Migration**: 6 (40%)

### By Priority
- **Critical (working)**: 8/8 ✅
- **High Priority**: 1/3 (33%)
- **Medium Priority**: 0/2 (0%)  
- **Low Priority**: 0/2 (0%)

## 🎯 Recommended Next Steps

### Phase 1: Complete High-Priority Routes (Recommended NOW)
1. **Migrate `/api/media/upload`** - Switch to local filesystem
   - Replace Supabase Storage with `@/lib/storage/local`
   - Update file URL generation
   - Test image/video uploads
   
2. **Migrate `/api/user/change-password`** - Use PostgreSQL users table
   - Update password hash in `autopostvn_users.password_hash`
   - Remove Supabase auth calls
   - Add bcrypt for password hashing

### Phase 2: User Management Routes (Optional)
3. Migrate `/api/user/delete-account`
4. Migrate `/api/user/export`

### Phase 3: Low Priority Features (Future)
5. Migrate `/api/upgrade-request`
6. Fully implement analytics (migrate FacebookInsightsService)

## 🚀 Quick Migration Guide

### Pattern 1: Replace Supabase Storage
```typescript
// BEFORE
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(...)
const { data } = await supabase.storage.from('bucket').upload(...)

// AFTER
import { uploadFile } from '@/lib/storage/local'
const result = await uploadFile('bucket', fileName, buffer)
```

### Pattern 2: Replace Auth Operations
```typescript
// BEFORE
await supabase.auth.admin.updateUserById(userId, { password })

// AFTER
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db/postgres'
const hash = await bcrypt.hash(password, 10)
await query('UPDATE autopostvn_users SET password_hash = $1 WHERE id = $2', [hash, userId])
```

## ✅ Current App Status

### Working Features
- ✅ User authentication (login/logout)
- ✅ Dashboard statistics
- ✅ Activity logs viewing
- ✅ Posts listing (view)
- ✅ Post creation/editing/deletion
- ✅ Schedule viewing
- ✅ **Analytics dashboard** - Real Facebook insights data
- ✅ **Best posting times** - Data-driven recommendations
- ✅ **Engagement metrics** - Likes, comments, shares, reach

### Temporarily Disabled
- ❌ Media upload (still uses Supabase)
- ❌ Password change (still uses Supabase)
- ❌ Account deletion (still uses Supabase)

### Not Affected
- ✅ Social account management (UserManagementService uses PostgreSQL)
- ✅ User profiles
- ✅ Workspace management

## 📝 Notes

### Auth Flow Fixed (Nov 9, 2025)
- ✅ Migrated from workspace-based auth to users table
- ✅ Auto-creates 1:1 workspace mapping on login
- ✅ Slug format: `user-{user_id}`
- ✅ Added `password_hash`, `email_verified` columns to users table

### Database Status
- ✅ 21/21 tables created
- ✅ Schema 100% matches Supabase export
- ✅ All indexes and triggers configured
- ✅ User migration completed (workspace → users)

### Known Issues
- Console may show rate limiting warnings when fetching Facebook insights (expected behavior)
- Analytics requires valid Facebook access tokens for social accounts
- Media upload will fail if attempted (pending migration)

---

**Last Updated**: November 9, 2025 16:45
**Migration Progress**: 60% complete (9/15 routes)
**Next Action**: Migrate `/api/media/upload` to use local filesystem storage

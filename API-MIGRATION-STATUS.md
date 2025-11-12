# 🚧 API Migration Status - PostgreSQL Migration

**Last Updated:** November 9, 2025  
**Database Schema:** ✅ 100% Complete (21/21 tables)  
**API Routes:** 🔄 10% Complete (3/45+ files migrated)

---

## ✅ COMPLETED

### 1. Database Infrastructure
- ✅ All 21 tables created in PostgreSQL
- ✅ Indexes, constraints, triggers configured
- ✅ Default data (rate limits) inserted
- ✅ Schema 100% matches Supabase export

### 2. Core Libraries
- ✅ `src/lib/db/postgres.ts` - PostgreSQL client with connection pooling
- ✅ `src/lib/auth.ts` - NextAuth using PostgreSQL
- ✅ `src/lib/services/UserManagementService.ts` - Full PostgreSQL

### 3. Migrated API Routes
- ✅ `/api/auth/register` - User registration with bcrypt
- ✅ `/api/posts` (GET only) - Fetch posts with PostgreSQL JOIN
- ✅ `/api/workspace/settings` - Get/Update workspace settings

### 4. Migrated Services  
- ✅ `ActivityLogService.log()` - Activity logging
- ✅ `ActivityLogService.getUserLogs()` - Fetch user logs with pagination

---

## ⏳ PENDING MIGRATION (45+ files)

### 🔥 **HIGH PRIORITY** - Blocking Core Features

#### User Management (3 files)
```
⚠️ /api/user/profile (GET, PUT)
⚠️ /api/user/export
⚠️ /api/user/delete-account
```

#### Dashboard (2 files)
```
⚠️ /api/dashboard/stats
⚠️ /api/dashboard/activities
```

#### Posts & Scheduling (1 file)
```
⚠️ /api/posts/schedules
⚠️ /api/posts (POST, PUT, DELETE) - Currently stubbed
```

#### OAuth (1 file)
```
⚠️ /api/oauth/buffer/callback
```

**Total High Priority:** 7 files

---

### 📝 **MEDIUM PRIORITY** - Debug & Development Tools (Can be Stubbed)

#### Debug Routes (14 files)
```
⚠️ /api/debug/user-role-check
⚠️ /api/debug/usage-check
⚠️ /api/debug/upgrade-user-role
⚠️ /api/debug/update-user-role
⚠️ /api/debug/session-compare
⚠️ /api/debug/force-update
⚠️ /api/debug/force-refresh-ai
⚠️ /api/debug/check-user-limits
⚠️ /api/debug/ai-limits
⚠️ /api/debug/reset-post-usage
⚠️ /api/debug/reset-ai-usage
⚠️ /api/debug/fix-ai-limits
⚠️ /api/dev/reset-rate-limit
⚠️ /api/admin/scheduler-status
```

**Total Medium Priority:** 14 files

---

### 🔧 **SERVICES** - Need Migration

```
⚠️ src/lib/services/media-lifecycle.service.ts (uses createClient)
⚠️ src/lib/services/aiUsageService.ts
⚠️ src/lib/services/limitsService.ts
⚠️ src/lib/services/postUsageService.ts
```

---

## 🎯 MIGRATION PLAN

### Phase 1: Core Functionality (Get App Working)
**Goal:** User can login, view dashboard, manage posts

1. ✅ `/api/workspace/settings` - DONE
2. ✅ `/api/posts` GET - DONE
3. ⏳ `/api/user/profile` - TODO (15 min)
4. ⏳ `/api/dashboard/stats` - TODO (15 min)
5. ⏳ Stub all debug routes - TODO (5 min)

**Estimated Time:** 35 minutes  
**Impact:** App becomes 80% functional

---

### Phase 2: Advanced Features
**Goal:** Full post management, scheduling

6. `/api/posts` POST, PUT, DELETE
7. `/api/posts/schedules`
8. `/api/dashboard/activities`

**Estimated Time:** 1-2 hours

---

### Phase 3: Cleanup
**Goal:** Migrate or remove debug/admin routes

9. Migrate or disable debug routes
10. Remove Supabase dependencies completely

**Estimated Time:** 1-2 hours

---

## 📝 MIGRATION TEMPLATE

### Standard Pattern:

```typescript
// ❌ BEFORE (Supabase)
import { sbServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = sbServer(true);
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// ✅ AFTER (PostgreSQL)
import { query } from '@/lib/db/postgres';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await query(
      'SELECT * FROM table_name WHERE user_id = $1 LIMIT 1',
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Database query failed' },
      { status: 500 }
    );
  }
}
```

---

## 🚀 QUICK START - Next Steps

### Get App Functional in 30 Minutes:

```bash
# 1. Current Status Check
npm run dev
# Open http://localhost:3000
# Login and check Console errors

# 2. Migrate Critical Routes
# Edit these files:
# - src/app/api/user/profile/route.ts
# - src/app/api/dashboard/stats/route.ts

# 3. Stub Debug Routes
# Create: src/app/api/debug/[...path]/route.ts
# Return 503 for all debug endpoints

# 4. Test Again
# Verify: Register → Login → Dashboard → Posts
```

---

## 📊 CURRENT STATE

### What Works:
- ✅ User registration
- ✅ User login
- ✅ View posts list
- ✅ Workspace settings

### What's Broken:
- ❌ User profile update
- ❌ Dashboard statistics  
- ❌ Activity logs (partially working)
- ❌ Post creation/editing
- ❌ Post scheduling

### Console Errors:
- `supabaseUrl is required` - From unmigrated routes
- Activity logs 500 errors - Service partially migrated
- Posts API errors - GET works, POST/PUT/DELETE stubbed

---

## ✨ SUCCESS CRITERIA

Migration complete when:
1. ✅ Zero Console errors on dashboard
2. ✅ All Tier 1 features working
3. ✅ No `sbServer()` imports in active code paths
4. ✅ User can: register, login, view/create/edit posts
5. ✅ Dashboard shows correct stats

**Current Progress:** ~20% (Database schema complete, core routes migrated)  
**Next Milestone:** 50% (All Tier 1 routes migrated)  
**Target:** 100% (All routes migrated or consciously disabled)

# 🚀 Migration: Supabase → PostgreSQL Local - QUICK START

## TL;DR - Chạy Migration trong 3 lệnh:

```powershell
# 1. Start PostgreSQL
.\scripts\setup-postgres.ps1

# 2. Run Migrations  
.\scripts\run-migrations.ps1

# 3. Test App
npm run dev
```

---

## 📚 Documentation Structure

### Bắt đầu đây:
1. **`MIGRATION-SUMMARY.md`** ← ĐỌC FILE NÀY TRƯỚC
   - Tổng quan 100% những gì đã làm
   - Architecture changes
   - Usage examples
   - Next steps

### Chi tiết:
2. **`MIGRATION-READY.md`**
   - Setup instructions
   - Troubleshooting
   - Database access info

3. **`SUPABASE-TO-POSTGRESQL-MIGRATION.md`**
   - Complete 300+ lines guide
   - Export/import instructions
   - Deployment guide

4. **`docs/MIGRATION-EXAMPLES.ts`**
   - Code examples
   - Before/after comparisons
   - Common patterns

---

## 🎯 What's Included

### ✅ Infrastructure (100% Ready)
- Docker Compose: PostgreSQL 15 + pgAdmin
- Auto-import schema on first start
- Health checks & monitoring

### ✅ Database Layer (100% Ready)
- `src/lib/db/postgres.ts` - Full PostgreSQL client
- `src/lib/db/supabase-compat.ts` - Supabase API compatibility
- Connection pooling, transactions, query builders

### ✅ Storage Layer (100% Ready)
- `src/lib/storage/local.ts` - Complete file storage
- Upload, delete, manage files
- Multi-bucket support
- File validation

### ✅ Scripts & Tools (100% Ready)
- `scripts/setup-postgres.ps1` - Auto setup
- `scripts/run-migrations.ps1` - Auto migrations
- One-command deployment

---

## 💡 Key Features

### Database:
```typescript
import { db } from '@/lib/db/supabase-compat';

// Same syntax as Supabase!
const { data } = await db
  .from('autopostvn_workspaces')
  .select('*')
  .eq('id', id)
  .single();
```

### Storage:
```typescript
import { uploadFile } from '@/lib/storage/local';

const result = await uploadFile('post-images', 'file.jpg', buffer);
// → http://localhost:3000/uploads/post-images/123-abc.jpg
```

---

## 🔗 Access Points

### PostgreSQL Database
- **Host:** localhost:5432
- **User:** autopost_admin
- **Password:** autopost_vn_secure_2025
- **Database:** autopost_vn

### pgAdmin
- **URL:** http://localhost:5050
- **Email:** admin@autopostvn.local
- **Password:** admin123

---

## 📖 Full Documentation

Read **`MIGRATION-SUMMARY.md`** for complete details.

---

**Migration is READY! Start with:**
```powershell
.\scripts\setup-postgres.ps1
```

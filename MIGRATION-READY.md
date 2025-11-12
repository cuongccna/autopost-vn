# 🎉 Migration Setup Completed!

## ✅ Những gì đã được chuẩn bị

### 1. **PostgreSQL Infrastructure**
- ✅ `docker-compose.yml` - PostgreSQL 15 + pgAdmin
- ✅ Scripts tự động:
  - `scripts/setup-postgres.ps1` - Khởi động PostgreSQL
  - `scripts/run-migrations.ps1` - Chạy tất cả migrations
  - `scripts/export-from-supabase.ps1` - Export từ Supabase (optional)

### 2. **Database Layer**
- ✅ `src/lib/db/postgres.ts` - PostgreSQL client với:
  - Connection pooling
  - Query helpers (query, insert, update, delete)
  - Transaction support
  - Health check

- ✅ `src/lib/db/supabase-compat.ts` - Compatibility layer:
  - Supabase-like API syntax
  - Minimal code changes needed
  - `.from()`, `.select()`, `.eq()`, `.insert()`, etc.

### 3. **Storage Layer**
- ✅ `src/lib/storage/local.ts` - Local filesystem storage:
  - Upload/download files
  - Delete/move/copy operations
  - Storage statistics
  - Cleanup old files
  - Buckets: post-images, post-videos, avatars, documents

### 4. **Environment Configuration**
- ✅ `.env.local` - Updated với PostgreSQL config:
  ```bash
  POSTGRES_HOST=localhost
  POSTGRES_PORT=5432
  POSTGRES_DATABASE=autopost_vn
  POSTGRES_USER=autopost_admin
  POSTGRES_PASSWORD=autopost_vn_secure_2025
  ```

### 5. **Migration Examples**
- ✅ `docs/MIGRATION-EXAMPLES.ts` - Complete migration patterns:
  - Supabase → PostgreSQL conversion
  - Storage migration
  - Common query patterns
  - Transaction examples

### 6. **Installed Dependencies**
- ✅ `pg` - PostgreSQL driver
- ✅ `@types/pg` - TypeScript types

---

## 🚀 Cách chạy Migration

### Bước 1: Khởi động PostgreSQL

```powershell
.\scripts\setup-postgres.ps1
```

**Kết quả:**
- PostgreSQL running tại `localhost:5432`
- pgAdmin tại `http://localhost:5050`
- Database `autopost_vn` được tạo
- Schema từ `supabase/schema.sql` được import tự động

### Bước 2: Chạy Migrations

```powershell
.\scripts\run-migrations.ps1
```

**Kết quả:**
- Tất cả migrations trong thư mục `migrations/` được chạy
- Bảng `autopostvn_media`, `autopostvn_system_activity_logs`, etc. được tạo
- Functions và triggers được setup

### Bước 3: Verify Database

```powershell
# Kết nối vào PostgreSQL
docker exec -it autopost-vn-postgres psql -U autopost_admin -d autopost_vn

# Trong psql, chạy:
\dt public.autopostvn_*    # List tất cả tables
\df public.*               # List functions
SELECT COUNT(*) FROM autopostvn_workspaces;  # Test query
```

### Bước 4: Test Application

```powershell
npm run dev
```

**Kiểm tra:**
- App khởi động không lỗi
- Database connection thành công
- Queries hoạt động

---

## 📊 Database Access

### PostgreSQL Direct Connection
- **Host:** localhost
- **Port:** 5432
- **Database:** autopost_vn
- **User:** autopost_admin
- **Password:** autopost_vn_secure_2025

### pgAdmin Web UI
- **URL:** http://localhost:5050
- **Email:** admin@autopostvn.local
- **Password:** admin123

**Add Server trong pgAdmin:**
1. Right-click "Servers" → Create → Server
2. General tab: Name = "AutoPost VN Local"
3. Connection tab:
   - Host: postgres (hoặc host.docker.internal nếu lỗi)
   - Port: 5432
   - Database: autopost_vn
   - Username: autopost_admin
   - Password: autopost_vn_secure_2025

---

## 🔄 Migration Status

### ✅ Đã hoàn thành:

1. **Infrastructure Setup**
   - Docker Compose configuration
   - PostgreSQL với auto-import schema
   - pgAdmin for management

2. **Database Client Layer**
   - PostgreSQL connection pool
   - Query builders and helpers
   - Supabase compatibility layer
   - Transaction support

3. **Storage System**
   - Local filesystem storage
   - Upload/download APIs
   - Multi-bucket support
   - File management functions

4. **Configuration**
   - Environment variables updated
   - PostgreSQL connection ready
   - Local storage paths configured

5. **Documentation**
   - Complete migration guide
   - Code examples
   - Pattern documentation

### ⚠️ Cần làm tiếp (Optional):

1. **Service Migration** - Có thể làm từ từ:
   - Services đã có example trong `docs/MIGRATION-EXAMPLES.ts`
   - Chỉ cần replace `import supabase` → `import { db }`
   - Thay `supabase.from()` → `db.from()`

2. **API Routes** - Migrate khi cần:
   - Follow pattern trong examples
   - Storage API đã có sẵn trong `src/lib/storage/local.ts`

3. **Testing** - Sau khi setup:
   - Test database queries
   - Test file uploads
   - Test authentication flow

---

## 💡 Sử dụng Database mới

### Query Pattern 1: Supabase-compatible (Recommended)

```typescript
import { db } from '@/lib/db/supabase-compat';

// SELECT
const { data, error } = await db
  .from('autopostvn_workspaces')
  .select('*')
  .eq('id', workspaceId)
  .single();

// INSERT
const { data, error } = await db
  .from('autopostvn_posts')
  .insert({ title: 'Test', content: 'Hello' });

// UPDATE  
const { data, error } = await db
  .from('autopostvn_posts')
  .update({ status: 'published' })
  .eq('id', postId);
```

### Query Pattern 2: Direct PostgreSQL

```typescript
import { query, insert, update } from '@/lib/db/postgres';

// Raw SQL
const result = await query('SELECT * FROM autopostvn_workspaces WHERE id = $1', [id]);
const workspace = result.rows[0];

// Helpers
const newPost = await insert('autopostvn_posts', {
  title: 'Test',
  content: 'Hello'
});

const updated = await update(
  'autopostvn_posts',
  { status: 'published' },
  { id: postId }
);
```

### Storage Pattern

```typescript
import { uploadFile, getFileUrl, deleteFile } from '@/lib/storage/local';

// Upload
const result = await uploadFile(
  'post-images',
  'photo.jpg',
  fileBuffer
);
console.log(result.publicUrl); // http://localhost:3000/uploads/post-images/123-abc.jpg

// Get URL
const url = getFileUrl('post-images', 'filename.jpg');

// Delete
await deleteFile('post-images', 'filename.jpg');
```

---

## 🐛 Troubleshooting

### PostgreSQL không start
```powershell
# Check Docker running
docker ps

# Start lại
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs -f postgres
```

### Không connect được database
```powershell
# Test connection
docker exec -it autopost-vn-postgres psql -U autopost_admin -d autopost_vn

# Nếu lỗi password, check docker-compose.yml:
#   POSTGRES_PASSWORD phải match với .env.local
```

### Migrations fail
```powershell
# Check syntax trong migration files
# Run lại specific migration:
Get-Content migrations/001_user_management.sql | docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn
```

### App không connect PostgreSQL
- Check `.env.local` có đúng credentials không
- Check PostgreSQL container đang chạy: `docker ps`
- Check app logs: `npm run dev`

---

## 📚 Resources

- **Main Migration Guide:** `SUPABASE-TO-POSTGRESQL-MIGRATION.md`
- **Code Examples:** `docs/MIGRATION-EXAMPLES.ts`
- **Quick Start:** `MIGRATION-QUICK-START.ps1`
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **pg Driver Docs:** https://node-postgres.com/

---

## 🎯 Next Steps

1. **Run Setup:**
   ```powershell
   .\scripts\setup-postgres.ps1
   .\scripts\run-migrations.ps1
   npm run dev
   ```

2. **Verify:**
   - Open pgAdmin: http://localhost:5050
   - Check tables exist
   - Test app functionality

3. **Migrate Services (Optional):**
   - Follow examples in `docs/MIGRATION-EXAMPLES.ts`
   - Migrate one service at a time
   - Test after each migration

4. **Deploy to VPS:**
   - Install PostgreSQL on VPS
   - Copy environment config
   - Run migrations
   - Update file upload paths

---

**Migration Infrastructure is READY! 🚀**

Bạn có thể bắt đầu với:
```powershell
.\scripts\setup-postgres.ps1
```

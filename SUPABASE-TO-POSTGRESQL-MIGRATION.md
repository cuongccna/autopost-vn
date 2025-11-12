# Migration Guide: Supabase → PostgreSQL Local

## 📋 Tổng quan

Tài liệu này hướng dẫn chi tiết cách chuyển đổi database từ **Supabase Cloud** sang **PostgreSQL Local** cho AutoPost VN.

---

## 🔍 Audit Kết nối Supabase hiện tại

### 1. **Các file sử dụng Supabase Client**

#### 📂 Core Database Clients
```
src/lib/supabase/
├── server.ts          → Server-side Supabase client
├── browser.ts         → Client-side Supabase client  
└── storage.ts         → Supabase Storage client
```

#### 📂 Services sử dụng Supabase
```
src/lib/services/
├── media-lifecycle.service.ts     → SUPABASE_URL + SERVICE_ROLE_KEY
├── UserManagementService.ts       → SUPABASE_URL + SERVICE_ROLE_KEY
├── activity-log.service.ts        → SUPABASE_URL + SERVICE_ROLE_KEY
└── workspace-settings.service.ts  → Supabase query builder

src/lib/utils/
├── tokenRefreshService.ts         → SUPABASE_URL + SERVICE_ROLE_KEY
└── facebookInsightsService.ts     → SUPABASE_URL + SERVICE_ROLE_KEY
```

#### 📂 API Routes sử dụng Supabase
```
src/app/api/
└── media/upload/route.ts          → Storage + Database insert
```

#### 📂 Components sử dụng Supabase
```
src/components/features/media/
├── MediaUploader.tsx              → Storage upload + query
└── MediaLibraryPicker.tsx         → Fetch media from DB
```

#### 📂 Core Libraries
```
src/lib/
├── auth.ts                        → NextAuth + Supabase
├── scheduler-optimized.ts         → Query post_schedules
└── social-publishers.ts           → Query + insert activity logs
```

### 2. **Environment Variables hiện tại**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fmvxmvahknbzzjzhofql.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-supabase-jwt-secret-here
SUPABASE_URL=https://fmvxmvahknbzzjzhofql.supabase.co
SUPABASE_SCHEMA=AutoPostVN

# Database Connection
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

### 3. **Supabase Features được sử dụng**

- ✅ **PostgreSQL Database** - Core data storage
- ✅ **Supabase Storage** - File upload (images, videos)
- ✅ **Row Level Security (RLS)** - Security policies
- ✅ **Realtime** (chưa sử dụng nhiều)
- ✅ **Auth** (sử dụng NextAuth thay vì Supabase Auth)

---

## 📦 Export Database từ Supabase

### Method 1: Sử dụng Supabase CLI (Recommended)

#### Bước 1: Cài đặt Supabase CLI

```powershell
# Windows - Sử dụng Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Hoặc dùng NPM
npm install -g supabase
```

#### Bước 2: Login vào Supabase

```powershell
supabase login
```

#### Bước 3: Link project

```powershell
# Tại thư mục project
cd d:\projects\autopost-vn-v2\autopost-vn

# Link với project ID của bạn
supabase link --project-ref fmvxmvahknbzzjzhofql
```

#### Bước 4: Export database schema

```powershell
# Export toàn bộ schema (tables, functions, triggers, RLS)
supabase db dump --file supabase/dump-schema.sql --schema public

# Export riêng data
supabase db dump --file supabase/dump-data.sql --data-only

# Export cả schema + data
supabase db dump --file supabase/dump-full.sql
```

### Method 2: Sử dụng pg_dump (Manual)

```powershell
# Lấy connection string từ Supabase Dashboard
# Settings → Database → Connection string → Direct connection

# Export schema only
pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.fmvxmvahknbzzjzhofql.supabase.co:5432/postgres" \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-acl \
  --file=supabase/export-schema.sql

# Export data only
pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.fmvxmvahknbzzjzhofql.supabase.co:5432/postgres" \
  --schema=public \
  --data-only \
  --no-owner \
  --no-acl \
  --file=supabase/export-data.sql

# Export full (schema + data)
pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.fmvxmvahknbzzjzhofql.supabase.co:5432/postgres" \
  --schema=public \
  --no-owner \
  --no-acl \
  --file=supabase/export-full.sql
```

### Method 3: Export từ Supabase Dashboard

1. Vào **Supabase Dashboard** → Project của bạn
2. Click **Database** → **Backups**
3. Click **Download** backup mới nhất
4. Giải nén file `.tar` được download

---

## 🐘 Setup PostgreSQL Local

### Option 1: Docker (Recommended)

#### Tạo file `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: autopost-vn-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: autopost_admin
      POSTGRES_PASSWORD: your_secure_password_here
      POSTGRES_DB: autopost_vn
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=en_US.UTF-8"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./supabase:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U autopost_admin"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Optional: pgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: autopost-vn-pgadmin
    restart: unless-stopped
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@autopostvn.local
      PGADMIN_DEFAULT_PASSWORD: admin123
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      - postgres

volumes:
  postgres_data:
    driver: local
  pgadmin_data:
    driver: local
```

#### Start PostgreSQL

```powershell
# Khởi động
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f postgres

# Truy cập pgAdmin
# http://localhost:5050
# Email: admin@autopostvn.local
# Password: admin123
```

### Option 2: PostgreSQL Native trên Windows

#### Download và cài đặt

1. Download PostgreSQL 15: https://www.postgresql.org/download/windows/
2. Chạy installer, chọn:
   - Port: `5432`
   - Password: `your_secure_password`
   - Locale: `Vietnamese, Vietnam` hoặc `English, United States`

#### Tạo database

```powershell
# Mở SQL Shell (psql)
psql -U postgres

# Trong psql shell
CREATE DATABASE autopost_vn WITH ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';
CREATE USER autopost_admin WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE autopost_vn TO autopost_admin;
\q
```

---

## 📥 Import Database vào PostgreSQL Local

### Bước 1: Tạo schema từ file export

```powershell
# Nếu dùng Docker
docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn < supabase/dump-schema.sql

# Nếu dùng PostgreSQL native
psql -U autopost_admin -d autopost_vn < supabase/dump-schema.sql
```

### Bước 2: Import data

```powershell
# Nếu dùng Docker
docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn < supabase/dump-data.sql

# Nếu dùng PostgreSQL native
psql -U autopost_admin -d autopost_vn < supabase/dump-data.sql
```

### Bước 3: Chạy migrations bổ sung

```powershell
# Chạy từng migration file theo thứ tự
docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn < migrations/001_user_management.sql
docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn < migrations/002_ai_usage_tracking.sql
docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn < migrations/003_post_limits_tracking.sql
docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn < migrations/004_add_phone_field.sql
docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn < migrations/005_update_ai_limits.sql
docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn < migrations/006_fix_ai_rate_limit_function.sql
docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn < migrations/007_optimize_ai_limits.sql
docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn < migrations/008_add_system_activity_logs.sql
docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn < migrations/009_add_workspace_settings.sql
docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn < migrations/create-media-table.sql
docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn < migrations/add-media-lifecycle.sql
```

### Bước 4: Verify import

```sql
-- Kết nối vào database
psql -U autopost_admin -d autopost_vn

-- Kiểm tra tables
\dt public.autopostvn_*

-- Kiểm tra data
SELECT COUNT(*) FROM public.autopostvn_workspaces;
SELECT COUNT(*) FROM public.autopostvn_social_accounts;
SELECT COUNT(*) FROM public.autopostvn_posts;
SELECT COUNT(*) FROM public.autopostvn_media;
```

---

## 🔧 Chuyển đổi Code sang PostgreSQL

### 1. **Cài đặt PostgreSQL Driver**

```powershell
npm install pg @types/pg
```

### 2. **Tạo PostgreSQL Client** (`src/lib/db/postgres.ts`)

```typescript
import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE || 'autopost_vn',
  user: process.env.POSTGRES_USER || 'autopost_admin',
  password: process.env.POSTGRES_PASSWORD,
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};

// Singleton pool instance
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);
    
    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
      process.exit(-1);
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const pool = getPool();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.LOG_LEVEL === 'debug') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Helper function để convert Supabase query sang PostgreSQL
export function buildQuery(options: {
  table: string;
  select?: string[];
  where?: Record<string, any>;
  orderBy?: { column: string; ascending: boolean };
  limit?: number;
  offset?: number;
}) {
  let query = `SELECT ${options.select?.join(', ') || '*'} FROM ${options.table}`;
  const params: any[] = [];
  let paramIndex = 1;

  if (options.where) {
    const conditions = Object.entries(options.where).map(([key, value]) => {
      params.push(value);
      return `${key} = $${paramIndex++}`;
    });
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  if (options.orderBy) {
    query += ` ORDER BY ${options.orderBy.column} ${options.orderBy.ascending ? 'ASC' : 'DESC'}`;
  }

  if (options.limit) {
    query += ` LIMIT ${options.limit}`;
  }

  if (options.offset) {
    query += ` OFFSET ${options.offset}`;
  }

  return { query, params };
}
```

### 3. **Update Environment Variables**

```bash
# .env.local - Thêm PostgreSQL config
# PostgreSQL Local Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=autopost_vn
POSTGRES_USER=autopost_admin
POSTGRES_PASSWORD=your_secure_password_here

# Keep Supabase config for Storage (if needed)
NEXT_PUBLIC_SUPABASE_URL=https://fmvxmvahknbzzjzhofql.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. **Migrate Services sang PostgreSQL**

#### Example: `src/lib/services/UserManagementService.ts`

**BEFORE (Supabase):**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getWorkspaces(userId: string) {
  const { data, error } = await supabase
    .from('autopostvn_workspaces')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data;
}
```

**AFTER (PostgreSQL):**
```typescript
import { query } from '@/lib/db/postgres';

export async function getWorkspaces(userId: string) {
  const result = await query(
    'SELECT * FROM autopostvn_workspaces WHERE user_id = $1',
    [userId]
  );
  
  return result.rows;
}
```

### 5. **Compatibility Layer** (Optional - giữ code Supabase syntax)

Tạo wrapper để giữ syntax Supabase: `src/lib/db/supabase-compat.ts`

```typescript
import { query, buildQuery } from './postgres';

export function from(table: string) {
  let queryOptions: any = { table };
  
  return {
    select(columns = '*') {
      queryOptions.select = columns === '*' ? ['*'] : columns.split(',').map((c: string) => c.trim());
      return this;
    },
    
    eq(column: string, value: any) {
      queryOptions.where = queryOptions.where || {};
      queryOptions.where[column] = value;
      return this;
    },
    
    order(column: string, options?: { ascending?: boolean }) {
      queryOptions.orderBy = { 
        column, 
        ascending: options?.ascending !== false 
      };
      return this;
    },
    
    limit(count: number) {
      queryOptions.limit = count;
      return this;
    },
    
    async execute() {
      const { query: sql, params } = buildQuery(queryOptions);
      const result = await query(sql, params);
      return { data: result.rows, error: null };
    }
  };
}

// Usage: Giống Supabase
// const { data, error } = await from('autopostvn_workspaces')
//   .select('*')
//   .eq('user_id', userId)
//   .execute();
```

---

## 🗂️ File Storage Migration

Supabase Storage cần xử lý riêng vì PostgreSQL không có tính năng này.

### Option 1: Tiếp tục dùng Supabase Storage

- Giữ Supabase Storage cho file uploads
- Chỉ migrate database sang PostgreSQL
- Update code để tách biệt Storage và Database clients

### Option 2: Migrate sang Local Storage (MinIO)

#### Setup MinIO với Docker

```yaml
# Thêm vào docker-compose.yml
  minio:
    image: minio/minio:latest
    container_name: autopost-vn-minio
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

volumes:
  minio_data:
    driver: local
```

#### Install MinIO Client

```powershell
npm install minio @types/minio
```

#### Tạo Storage Client: `src/lib/storage/minio.ts`

```typescript
import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
});

export async function uploadFile(
  bucket: string,
  filename: string,
  file: Buffer,
  contentType: string
) {
  // Create bucket if not exists
  const exists = await minioClient.bucketExists(bucket);
  if (!exists) {
    await minioClient.makeBucket(bucket, 'us-east-1');
  }

  // Upload file
  await minioClient.putObject(bucket, filename, file, file.length, {
    'Content-Type': contentType
  });

  // Get public URL
  const url = await minioClient.presignedGetObject(bucket, filename, 24 * 60 * 60);
  return url;
}

export async function deleteFile(bucket: string, filename: string) {
  await minioClient.removeObject(bucket, filename);
}

export async function getFileUrl(bucket: string, filename: string) {
  return await minioClient.presignedGetObject(bucket, filename, 24 * 60 * 60);
}
```

### Option 3: Local File System

```typescript
// src/lib/storage/local.ts
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export async function uploadFile(
  bucket: string,
  filename: string,
  file: Buffer
) {
  const dir = path.join(UPLOAD_DIR, bucket);
  await fs.mkdir(dir, { recursive: true });
  
  const filepath = path.join(dir, filename);
  await fs.writeFile(filepath, file);
  
  return `/uploads/${bucket}/${filename}`;
}

export async function deleteFile(bucket: string, filename: string) {
  const filepath = path.join(UPLOAD_DIR, bucket, filename);
  await fs.unlink(filepath);
}
```

---

## ✅ Migration Checklist

### Phase 1: Preparation
- [ ] Export Supabase schema using CLI
- [ ] Export Supabase data
- [ ] Setup PostgreSQL local (Docker hoặc native)
- [ ] Test PostgreSQL connection

### Phase 2: Database Migration
- [ ] Import schema vào PostgreSQL local
- [ ] Import data
- [ ] Run all migrations
- [ ] Verify data integrity

### Phase 3: Code Migration
- [ ] Install `pg` driver
- [ ] Create PostgreSQL client (`src/lib/db/postgres.ts`)
- [ ] Update environment variables
- [ ] Migrate services:
  - [ ] `UserManagementService.ts`
  - [ ] `media-lifecycle.service.ts`
  - [ ] `activity-log.service.ts`
  - [ ] `workspace-settings.service.ts`
  - [ ] `tokenRefreshService.ts`
  - [ ] `facebookInsightsService.ts`
- [ ] Migrate API routes:
  - [ ] `/api/media/upload`
  - [ ] `/api/user/*`
  - [ ] `/api/posts/*`
- [ ] Update core libs:
  - [ ] `src/lib/auth.ts`
  - [ ] `src/lib/scheduler-optimized.ts`
  - [ ] `src/lib/social-publishers.ts`

### Phase 4: Storage Migration (Optional)
- [ ] Quyết định storage strategy
- [ ] Setup MinIO hoặc giữ Supabase Storage
- [ ] Migrate media upload logic
- [ ] Test file upload/download

### Phase 5: Testing
- [ ] Test database connections
- [ ] Test CRUD operations
- [ ] Test file uploads
- [ ] Test authentication flow
- [ ] Test scheduled posts
- [ ] Test analytics queries

### Phase 6: Deployment
- [ ] Update production .env
- [ ] Deploy PostgreSQL to VPS
- [ ] Deploy app with new config
- [ ] Monitor logs and errors

---

## 🚀 Quick Start Script

Tạo script tự động: `scripts/migrate-to-postgres.sh`

```bash
#!/bin/bash

echo "🚀 AutoPost VN - Supabase to PostgreSQL Migration"
echo "=================================================="

# 1. Export from Supabase
echo "📤 Step 1: Exporting from Supabase..."
supabase db dump --file supabase/dump-full.sql

# 2. Start PostgreSQL
echo "🐘 Step 2: Starting PostgreSQL..."
docker-compose up -d postgres

# 3. Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
sleep 10

# 4. Import to PostgreSQL
echo "📥 Step 3: Importing to PostgreSQL..."
docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn < supabase/dump-full.sql

# 5. Run migrations
echo "🔄 Step 4: Running migrations..."
for file in migrations/*.sql; do
  echo "Running $file..."
  docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn < "$file"
done

# 6. Verify
echo "✅ Step 5: Verifying..."
docker exec -i autopost-vn-postgres psql -U autopost_admin -d autopost_vn -c "\dt public.autopostvn_*"

echo "✨ Migration completed!"
```

---

## 📞 Support

Nếu gặp vấn đề trong quá trình migration:

1. Kiểm tra logs: `docker-compose logs postgres`
2. Test connection: `psql -U autopost_admin -h localhost -d autopost_vn`
3. Verify tables: `\dt public.autopostvn_*`
4. Check data: `SELECT COUNT(*) FROM autopostvn_workspaces;`

---

**Last Updated:** November 7, 2025

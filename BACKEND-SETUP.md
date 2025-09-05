# AutoPost VN - Backend Setup Guide

## 🎯 Tổng quan Backend

Backend AutoPost VN được thiết kế theo kiến trúc service-oriented với các thành phần chính:

- **Database Layer**: Supabase PostgreSQL với schema tối ưu
- **Service Layer**: Services cho Post, Social Account, Analytics
- **Controller Layer**: Backend controller tập trung
- **API Layer**: RESTful API endpoints với Next.js App Router
- **Client Layer**: Frontend API client với React hooks

## 📊 Kiến trúc Backend

```
src/lib/backend/
├── controllers/
│   └── main.ts              # Backend controller chính
├── services/
│   ├── database.ts          # Database service
│   ├── post.ts             # Post management
│   ├── socialAccount.ts    # Social media accounts
│   └── analytics.ts        # Analytics & reporting
├── utils/
│   └── encryption.ts       # Encryption utilities
└── types.ts                # TypeScript interfaces

src/app/api/v1/
└── [...action]/
    └── route.ts            # API endpoints

src/lib/api/
└── client.ts               # Frontend API client
```

## 🚀 Cài đặt Backend

### 1. Database Setup (Supabase)

```bash
# 1. Đăng nhập Supabase và tạo project mới
# 2. Copy database URL và keys
# 3. Import schema từ supabase/schema.sql
```

**Import Schema:**
```sql
-- Copy toàn bộ nội dung từ supabase/schema.sql
-- Chạy trong Supabase SQL Editor
```

### 2. Environment Variables

Copy `.env.example` thành `.env.local`:

```bash
cp .env.example .env.local
```

Điền các giá trị cần thiết:

```env
# Supabase (bắt buộc)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Encryption (bắt buộc)
ENCRYPTION_KEY=your-32-character-encryption-key

# Social Media APIs (tùy chọn, cần khi kết nối)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
ZALO_APP_ID=your_zalo_app_id
ZALO_APP_SECRET=your_zalo_app_secret
```

### 3. Install Dependencies

```bash
npm install
# hoặc
yarn install
```

### 4. Start Development Server

```bash
npm run dev
# hoặc
yarn dev
```

## 📡 API Endpoints

Backend cung cấp RESTful API qua `/api/v1/`:

### Posts
- `GET /api/v1/posts?workspaceId=xxx` - Lấy danh sách posts
- `GET /api/v1/posts/{id}?workspaceId=xxx` - Lấy post cụ thể
- `POST /api/v1/posts?workspaceId=xxx` - Tạo post mới
- `PUT /api/v1/posts/{id}?workspaceId=xxx` - Cập nhật post
- `DELETE /api/v1/posts/{id}?workspaceId=xxx` - Xóa post
- `POST /api/v1/posts/reschedule/{id}?workspaceId=xxx` - Đổi lịch post

### Social Accounts
- `GET /api/v1/accounts?workspaceId=xxx` - Lấy danh sách tài khoản
- `POST /api/v1/accounts?workspaceId=xxx` - Kết nối tài khoản mới
- `DELETE /api/v1/accounts/{id}?workspaceId=xxx` - Ngắt kết nối
- `POST /api/v1/accounts/refresh/{id}?workspaceId=xxx` - Refresh token
- `GET /api/v1/accounts/health/{id}?workspaceId=xxx` - Kiểm tra tình trạng

### Analytics
- `GET /api/v1/analytics/posts?workspaceId=xxx` - Thống kê posts
- `GET /api/v1/analytics/accounts?workspaceId=xxx` - Hiệu suất tài khoản
- `GET /api/v1/analytics/engagement?workspaceId=xxx&timeframe=week` - Engagement stats
- `GET /api/v1/analytics/optimal-times?workspaceId=xxx` - Thời gian tối ưu
- `GET /api/v1/analytics/errors?workspaceId=xxx` - Phân tích lỗi

### Dashboard & System
- `GET /api/v1/dashboard?workspaceId=xxx` - Dữ liệu dashboard tổng hợp
- `GET /api/v1/health` - Kiểm tra tình trạng hệ thống

## 🔧 Sử dụng Frontend API Client

### Basic Usage

```typescript
import { apiClient } from '@/lib/api/client';

// Lấy danh sách posts
const response = await apiClient.getPosts('workspace-id');
if (response.success) {
  console.log(response.data);
}

// Tạo post mới
const newPost = await apiClient.createPost('workspace-id', {
  title: 'Test Post',
  content: 'Hello World',
  scheduled_at: '2024-01-15T10:00:00Z'
});
```

### React Hooks

```typescript
import { usePosts, useCreatePost } from '@/lib/api/client';

function PostsComponent() {
  const { data: posts, loading, error, refetch } = usePosts('workspace-id');
  const { mutate: createPost, loading: creating } = useCreatePost('workspace-id');

  const handleCreatePost = async () => {
    try {
      await createPost({
        title: 'New Post',
        content: 'Content here'
      });
      refetch(); // Refresh danh sách
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {posts?.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
      <button onClick={handleCreatePost} disabled={creating}>
        Create Post
      </button>
    </div>
  );
}
```

## 🛡️ Security Features

### 1. Data Encryption
- Social media tokens được mã hóa trước khi lưu database
- Sử dụng AES-256-GCM encryption
- Encryption key từ environment variable

### 2. Row Level Security (RLS)
- Supabase RLS policies đảm bảo data isolation
- Users chỉ truy cập được data của workspace mình
- Automatic audit trail với created_at/updated_at

### 3. API Security
- Environment variables cho sensitive data
- Service role key cho backend operations
- Input validation và error handling

## 📈 Database Schema Highlights

### Core Tables
- `workspaces` - Multi-tenant workspace management
- `social_accounts` - Encrypted social media credentials
- `posts` - Content và scheduling information
- `post_schedules` - Chi tiết lịch đăng
- `analytics_events` - Event tracking cho analytics
- `error_logs` - Centralized error logging

### Advanced Features
- **Views**: Pre-computed analytics views
- **Triggers**: Auto-update timestamps và audit
- **Functions**: Database-level business logic
- **Sample Data**: Test data để development

## 🔄 Backend Services Overview

### DatabaseService
- Kết nối Supabase
- CRUD operations
- Query builder utilities

### PostService  
- Post lifecycle management
- Scheduling logic
- Status transitions
- Media handling

### SocialAccountService
- Multi-platform account management
- Token encryption/decryption
- Health monitoring
- Auto-refresh tokens

### AnalyticsService
- Engagement tracking
- Performance metrics
- Optimal timing analysis
- Error reporting

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Supabase project setup
- [ ] Database schema imported
- [ ] Environment variables configured
- [ ] Social media apps configured
- [ ] SSL certificates ready

### Production Settings
- [ ] `NODE_ENV=production`
- [ ] Secure encryption key
- [ ] Database connection pooling
- [ ] Error monitoring (Sentry)
- [ ] Performance monitoring

### Post-deployment Testing
- [ ] API endpoints accessible
- [ ] Database connections working
- [ ] Social media OAuth flows
- [ ] Cron jobs scheduled
- [ ] Error handling working

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```typescript
// Check environment variables
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Service Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
```

**Encryption Errors**
```typescript
// Verify encryption key length (must be 32 characters)
console.log('Key length:', process.env.ENCRYPTION_KEY?.length);
```

**API Route Not Found**
```typescript
// Ensure correct file structure: app/api/v1/[...action]/route.ts
// Check Next.js app router configuration
```

## 📞 Support

Nếu gặp vấn đề trong quá trình setup backend:

1. Kiểm tra console logs trong browser dev tools
2. Xem server logs trong terminal
3. Verify database connection trong Supabase dashboard
4. Test API endpoints với Postman/curl

Backend architecture sẵn sàng để scale và mở rộng thêm tính năng!

# Media Library Management System

## 📋 Tổng quan

Hệ thống quản lý Media (images + videos) đầy đủ với lifecycle management, cho phép users:
- Upload & quản lý images/videos
- Xem chi tiết, download, tag media
- Theo dõi media được publish lên platforms nào
- Tự động archive & cleanup old media theo user role

---

## ✅ Đã Hoàn thành

### 1. **Database Migration**
File: `migrations/add-media-lifecycle.sql`

**Columns mới:**
```sql
- status VARCHAR(20)           -- uploaded, processing, published, archived, deleted
- published_at TIMESTAMP       -- Thời điểm đăng lên platforms
- archived_at TIMESTAMP        -- Thời điểm archive
- deleted_at TIMESTAMP         -- Soft delete timestamp
- engagement_score INTEGER     -- Combined engagement from all platforms
- platform_urls JSONB          -- {"facebook": "url", "tiktok": "url"}
- metadata JSONB               -- Duration, dimensions, etc
- tags TEXT[]                  -- User-defined tags
- media_type VARCHAR(20)       -- image | video
```

**Indexes:**
```sql
- idx_media_lifecycle: (status, published_at, archived_at)
- idx_media_user_status: (user_id, status, created_at DESC)
- idx_media_type_status: (media_type, status)
- idx_media_workspace: (workspace_id, status, created_at DESC)
```

**RLS Policies:**
- Users can only view/insert/update/delete their own media

---

### 2. **Backend Service**
File: `src/lib/services/media-lifecycle.service.ts`

#### **Enums & Types:**
```typescript
enum MediaStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video'
}

interface MediaLifecyclePolicy {
  archiveAfterDays: number;
  deleteArchivedAfterDays: number;
  keepHighEngagement: boolean;
  engagementThreshold: number;
}
```

#### **Lifecycle Policies:**
```typescript
free: {
  archiveAfterDays: 30,          // Archive sau 30 ngày
  deleteArchivedAfterDays: 90,   // Xóa sau 90 ngày archive
  keepHighEngagement: true,
  engagementThreshold: 500,
}

professional: {
  archiveAfterDays: 90,          // Archive sau 90 ngày
  deleteArchivedAfterDays: 365,  // Xóa sau 1 năm
  keepHighEngagement: true,
  engagementThreshold: 1000,
}

enterprise: {
  archiveAfterDays: 180,         // Archive sau 6 tháng
  deleteArchivedAfterDays: 0,    // KHÔNG tự động xóa
  keepHighEngagement: true,
  engagementThreshold: 0,
}
```

#### **Core Functions:**
- `getUserMedia()` - Get media with filters (type, status, search, tags)
- `getMediaItem()` - Get single media details
- `updateMediaStatus()` - Update status (uploaded → published → archived → deleted)
- `updatePlatformUrls()` - Save platform URLs sau khi publish
- `updateEngagementScore()` - Update engagement từ platforms
- `updateMediaTags()` - Tag management
- `softDeleteMedia()` - Mark as deleted
- `hardDeleteMedia()` - Permanently delete from storage & DB
- `archiveOldMedia()` - Auto archive published media
- `deleteArchivedMedia()` - Auto delete old archived media
- `getMediaStats()` - Storage statistics

---

### 3. **API Endpoints**

#### **GET /api/media**
List user's media with filters
```typescript
Query params:
- workspaceId?: string
- mediaType?: 'image' | 'video'
- status?: 'uploaded' | 'published' | 'archived'
- search?: string
- tags?: string (comma-separated)
- limit?: number (default: 50)
- offset?: number (default: 0)

Response:
{
  items: MediaItem[],
  total: number,
  limit: number,
  offset: number
}
```

#### **PATCH /api/media**
Update media
```typescript
Body:
{
  mediaId: string,
  status?: MediaStatus,
  tags?: string[],
  metadata?: Record<string, any>
}
```

#### **DELETE /api/media**
Delete media
```typescript
Query params:
- mediaId: string
- hard?: boolean (true = permanently delete, false = soft delete)
```

#### **GET /api/media/stats**
Get storage statistics
```typescript
Query params:
- workspaceId?: string

Response:
{
  total: number,
  images: number,
  videos: number,
  uploaded: number,
  published: number,
  archived: number,
  totalSize: number,
  imageSize: number,
  videoSize: number
}
```

#### **GET/POST /api/cron/media-cleanup**
Auto cleanup job (runs daily)
```typescript
Authorization: Bearer {CRON_SECRET}

Response:
{
  success: true,
  results: {
    free: { archivedCount, deletedCount },
    professional: { archivedCount, deletedCount },
    enterprise: { archivedCount, deletedCount }
  },
  summary: {
    totalArchived: number,
    totalDeleted: number,
    timestamp: string
  }
}
```

---

### 4. **UI Components**

#### **MediaLibrary.tsx**
Main media management page

**Features:**
- 📊 Stats dashboard (total, images, videos, storage)
- 🔍 Search & filters (type, status, tags)
- 🎨 Grid / List view toggle
- 📤 Upload button
- 🗑️ Soft delete
- 👁️ Preview modal

**Views:**
- **Grid View**: Thumbnail cards with status badges
- **List View**: Table with file details

#### **MediaPreviewModal.tsx**
Detail preview & actions

**Features:**
- 🖼️ Image/Video preview
- 📥 Download file
- 📋 Copy public URL
- 🏷️ Tag management (add/remove)
- 🌐 Platform URLs (Facebook, TikTok, Instagram, Zalo)
- 📊 Engagement score visualization
- 🗑️ Delete action

#### **MediaUploader.tsx**
Drag & drop uploader

**Features:**
- 📂 Drag & drop + file browser
- 📦 Multi-file upload
- 📊 Upload progress tracking
- ✅ Success/Error status
- 🖼️ Image preview
- ➕ Add more files during upload

---

### 5. **Integration**

#### **Sidebar Navigation**
Added "Thư viện Media" 🎬 tab

```typescript
const tabs = [
  { id: 'calendar', label: 'Lịch & Lên lịch', icon: '📅' },
  { id: 'queue', label: 'Hàng đợi & Nhật ký', icon: '📄' },
  { id: 'media', label: 'Thư viện Media', icon: '🎬' },  // ✅ NEW
  { id: 'analytics', label: 'Phân tích', icon: '📈' },
  ...
];
```

#### **Media Page**
Route: `/media`
File: `src/app/media/page.tsx`

---

## 🔄 Workflow Example

### **Upload → Publish → Archive → Delete**

```typescript
// 1. User uploads video
POST /api/media/upload
→ Status: UPLOADED

// 2. User publishes to Facebook
await publishToFacebook(videoUrl)
→ Call: updatePlatformUrls(mediaId, 'facebook', facebookUrl)
→ Status: PUBLISHED

// 3. After 90 days (for professional users)
Cron job runs
→ Status: ARCHIVED

// 4. After 365 days (for professional users)
Cron job runs
→ If engagement < 1000: Permanently DELETE
→ If engagement >= 1000: KEEP forever
```

---

## 📊 Storage Cost Estimation

```
Scenario: 1000 professional users
- Average: 10 videos/month × 50MB = 500MB/user
- Lifecycle: Keep 90 days active + 365 days archive
- Total: 1000 users × 500MB × 15 months = 7,500GB

Cost (Supabase):
- 7,500GB × $0.021/GB = $157.5/month
- Per user: $0.157/month
- Revenue: $10/user/month
- Storage cost = 1.57% of revenue ✅ ACCEPTABLE
```

---

## 🎯 Use Cases

### **UC1: User uploads product video**
```typescript
1. User clicks "Upload Media" button
2. Drags video file (or browses)
3. Video uploads to Supabase Storage
4. Record saved to autopostvn_media with status='uploaded'
5. User can immediately use video in Compose page
```

### **UC2: User publishes to multiple platforms**
```typescript
1. User creates post in Compose page
2. Selects video from Media Library
3. Publishes to Facebook, TikTok, Instagram
4. System calls:
   - updatePlatformUrls(mediaId, 'facebook', url1)
   - updatePlatformUrls(mediaId, 'tiktok', url2)
   - updatePlatformUrls(mediaId, 'instagram', url3)
5. Status changes to 'published'
6. Video details show all 3 platform links
```

### **UC3: User manages old content**
```typescript
1. User opens Media Library
2. Filters by: status='archived'
3. Sees videos from 3+ months ago
4. High engagement videos kept
5. Low engagement videos auto-deleted after 1 year
6. User can manually delete anytime
```

### **UC4: User downloads published video**
```typescript
1. User clicks on video thumbnail
2. Preview modal opens
3. User sees:
   - Original video
   - Facebook URL
   - TikTok URL
   - Engagement: 5,234 views
4. User clicks "Download" → Gets original quality
```

---

## 🚀 Next Steps (Optional)

### **1. Enhanced Upload**
```typescript
- Video compression before upload
- Thumbnail generation
- Duration detection
- Resolution detection
- Metadata extraction (EXIF)
```

### **2. Workspace Settings Integration**
```typescript
interface WorkspaceSettings {
  mediaLifecyclePolicy?: {
    archiveAfterDays: number,
    deleteArchivedAfterDays: number,
    keepHighEngagement: boolean,
    engagementThreshold: number
  }
}

// Allow workspace owners to customize lifecycle
```

### **3. Platform Sync**
```typescript
// Auto-sync engagement scores from platforms
const syncEngagement = async (mediaId: string) => {
  const media = await getMediaItem(mediaId);
  const scores = await Promise.all([
    getFacebookEngagement(media.platform_urls.facebook),
    getTikTokEngagement(media.platform_urls.tiktok),
    getInstagramEngagement(media.platform_urls.instagram)
  ]);
  
  const totalScore = scores.reduce((sum, s) => sum + s, 0);
  await updateEngagementScore(mediaId, totalScore);
};
```

### **4. Smart Recommendations**
```typescript
// Suggest best performing media for reuse
const getTopPerformingMedia = async (userId: string) => {
  return getUserMedia({
    userId,
    status: MediaStatus.PUBLISHED,
    limit: 10,
    sortBy: 'engagement_score',
    order: 'desc'
  });
};
```

---

## 🧪 Testing

### **Manual Tests:**

1. **Upload Flow:**
   - [ ] Upload single image
   - [ ] Upload single video
   - [ ] Upload multiple files
   - [ ] Upload with drag & drop
   - [ ] Check progress tracking
   - [ ] Verify success/error states

2. **Media Library:**
   - [ ] View grid/list modes
   - [ ] Search files
   - [ ] Filter by type (image/video)
   - [ ] Filter by status
   - [ ] Tag management

3. **Preview Modal:**
   - [ ] View image
   - [ ] Play video
   - [ ] Download file
   - [ ] Copy URL
   - [ ] Add/remove tags
   - [ ] Delete file

4. **Lifecycle:**
   - [ ] Upload → status=uploaded
   - [ ] Publish → status=published
   - [ ] Manual trigger cron → check archive
   - [ ] Check soft delete
   - [ ] Check hard delete

---

## 📝 Migration Guide

### **Step 1: Run SQL Migration**
```bash
psql -d autopostvn -f migrations/add-media-lifecycle.sql
```

### **Step 2: Update Environment**
```env
# Add to .env.local
CRON_SECRET=your-secret-key-here
```

### **Step 3: Setup Vercel Cron**
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/media-cleanup",
    "schedule": "0 2 * * *"
  }]
}
```

### **Step 4: Create Supabase Storage Bucket**
```sql
-- In Supabase Dashboard → Storage
CREATE BUCKET media (
  public: true,
  file_size_limit: 104857600  -- 100MB
);

-- Add RLS policy
CREATE POLICY "Users can upload own media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## ✅ Completion Checklist

- [x] Database migration with lifecycle columns
- [x] Media lifecycle service with policies
- [x] API endpoints (GET, PATCH, DELETE, stats)
- [x] Cron job for auto cleanup
- [x] MediaLibrary UI component
- [x] MediaPreviewModal component
- [x] MediaUploader component
- [x] Media page route
- [x] Sidebar navigation integration
- [x] Documentation

---

**Status**: ✅ **COMPLETED**
**Date**: 2025-11-03
**Impact**: 🚀 **HIGH** - Complete media management system with lifecycle automation

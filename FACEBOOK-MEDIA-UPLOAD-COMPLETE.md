# Facebook Media Upload Implementation Guide

## ✅ Hoàn Thành - 27/10/2025

Tính năng upload ảnh và video cho Facebook đã được triển khai hoàn chỉnh.

---

## 📋 Tổng Quan

Hệ thống cho phép người dùng:
- ✅ Upload ảnh (JPEG, PNG, GIF, WEBP) - tối đa 10MB
- ✅ Upload video (MP4, MOV, AVI) - tối đa 100MB  
- ✅ Upload nhiều file cùng lúc (album)
- ✅ Format text với Unicode bold và italic
- ✅ Chèn emoji từ thư viện phong phú
- ✅ Preview media trước khi đăng
- ✅ Tự động publish lên Facebook Page

---

## 🏗️ Kiến Trúc

### 1. Storage - Supabase Storage
```
Buckets:
├── post-images/          # Ảnh (10MB max)
│   └── {userId}/
│       └── {timestamp}-{random}.{ext}
└── post-videos/          # Video (100MB max)
    └── {userId}/
        └── {timestamp}-{random}.{ext}
```

### 2. Database Schema
```sql
-- Table: autopostvn_posts
ALTER TABLE public.autopostvn_posts
ADD COLUMN media_type VARCHAR(20) DEFAULT 'none';

-- Constraint
CHECK (media_type IN ('image', 'video', 'album', 'none'))

-- Index
CREATE INDEX idx_autopostvn_posts_media_type 
ON public.autopostvn_posts(media_type);
```

### 3. Components Architecture
```
ComposeModal
├── ContentEditor         # Text formatting + Emoji
│   ├── Bold (Unicode)
│   ├── Italic (Unicode)
│   └── Emoji Picker
└── MediaUploader         # File upload + Preview
    ├── Drag & Drop
    ├── File Validation
    ├── Upload to Storage
    └── Preview Grid
```

---

## 🔧 API Endpoints

### 1. Upload Media
**POST** `/api/media/upload`

```typescript
// Request - FormData
{
  file: File  // Image or Video file
}

// Response
{
  success: true,
  file: {
    name: string,
    type: string,
    size: number,
    url: string,           // Public URL
    path: string,          // Storage path
    bucket: string,        // post-images or post-videos
    mediaType: 'image' | 'video'
  }
}
```

**DELETE** `/api/media/upload?bucket={bucket}&path={path}`

```typescript
// Response
{
  success: true,
  message: "File deleted successfully"
}
```

### 2. Create Post with Media
**POST** `/api/posts`

```typescript
{
  title: string,
  content: string,
  providers: string[],
  scheduled_at: string,
  media_urls: string[],    // URLs from upload
  media_type: 'image' | 'video' | 'album' | 'none'
}
```

---

## 📦 Components Detail

### MediaUploader Component
**Path:** `src/components/ui/MediaUploader.tsx`

```typescript
interface MediaUploaderProps {
  onMediaChange: (media: UploadedMedia[]) => void;
  maxFiles?: number;          // Default: 10
  acceptImages?: boolean;     // Default: true
  acceptVideos?: boolean;     // Default: true
  className?: string;
}

interface UploadedMedia {
  name: string;
  type: string;
  size: number;
  url: string;              // Supabase public URL
  path: string;             // Storage path
  bucket: string;           // Bucket name
  mediaType: 'image' | 'video';
  preview?: string;         // Local blob URL
}
```

**Features:**
- ✅ Drag & drop file upload
- ✅ Click to browse files
- ✅ Multiple file selection
- ✅ Real-time upload progress
- ✅ Image/video preview thumbnails
- ✅ Remove uploaded files
- ✅ File type & size validation
- ✅ Auto-upload to Supabase Storage

**Usage:**
```tsx
import MediaUploader from '@/components/ui/MediaUploader';

<MediaUploader
  onMediaChange={setUploadedMedia}
  maxFiles={10}
  acceptImages={true}
  acceptVideos={true}
/>
```

---

### ContentEditor Component
**Path:** `src/components/ui/ContentEditor.tsx`

```typescript
interface ContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;       // Default: 2000
}
```

**Features:**
- ✅ Unicode bold formatting (𝗮𝗯𝗰 𝗔𝗕𝗖 𝟭𝟮𝟯)
- ✅ Unicode italic formatting (𝘢𝘣𝘤 𝘈𝘉𝘊)
- ✅ Emoji picker với 4 categories:
  - Cảm xúc (😀😃😄😁...)
  - Hoạt động (👍👎👏🙌...)
  - Kinh doanh (💼💰💵💳...)
  - Xu hướng (🔥💯✨⭐...)
- ✅ Character counter
- ✅ Keyboard shortcuts

**Unicode Mappings:**
```typescript
// Bold: a → 𝗮, B → 𝗕, 1 → 𝟭
const BOLD_MAP = {
  'a': '𝗮', 'b': '𝗯', 'c': '𝗰', ...
  'A': '𝗔', 'B': '𝗕', 'C': '𝗖', ...
  '0': '𝟬', '1': '𝟭', '2': '𝟮', ...
}

// Italic: a → 𝘢, B → 𝘉
const ITALIC_MAP = {
  'a': '𝘢', 'b': '𝘣', 'c': '𝘤', ...
  'A': '𝘈', 'B': '𝘉', 'C': '𝘊', ...
}
```

**Usage:**
```tsx
import ContentEditor from '@/components/ui/ContentEditor';

<ContentEditor
  value={content}
  onChange={setContent}
  placeholder="Viết nội dung..."
  maxLength={2000}
/>
```

---

## 🚀 Facebook Publishing Flow

### 1. Image Post
```typescript
// FacebookPublisher handles:
1. Upload images to Facebook Photos API
2. Get media IDs
3. Create post with attached_media

// Endpoint
POST /{pageId}/photos
{
  url: mediaUrl,
  published: false,     // Unpublished for later use
  access_token: token
}

// Response
{ id: "photo_id_123" }
```

### 2. Video Post
```typescript
// FacebookPublisher handles:
1. Upload video via file_url
2. Create video post

// Endpoint
POST /{pageId}/videos
{
  description: content,
  file_url: videoUrl,
  access_token: token,
  scheduled_publish_time: timestamp  // Optional
}

// Response
{ id: "video_id_456" }
```

### 3. Album Post (Multiple Images)
```typescript
// FacebookPublisher handles:
1. Upload multiple images
2. Get array of media IDs
3. Create album post

// Endpoint
POST /{pageId}/feed
{
  message: content,
  attached_media: [
    { media_fbid: "id1" },
    { media_fbid: "id2" }
  ],
  access_token: token
}
```

---

## 🎯 User Journey

### Bước 1: Tạo Bài Viết
```
1. Người dùng mở ComposeModal
2. Chọn platform: Facebook
3. Viết nội dung với ContentEditor
   - Chọn text → Click Bold/Italic
   - Click emoji icon → Chọn emoji
4. Upload media với MediaUploader
   - Drag & drop files hoặc click browse
   - Preview thumbnails hiện ra
   - Click X để xóa file
```

### Bước 2: Upload & Preview
```
1. Files upload tự động lên Supabase Storage
2. Progress indicator hiển thị
3. Thumbnail preview với:
   - Images: Show ảnh
   - Videos: Show video icon + preview
4. File info: Tên file, kích thước
```

### Bước 3: Schedule & Publish
```
1. Chọn thời gian đăng (hoặc Golden Hours)
2. Click "Lên lịch bài đăng"
3. System saves:
   - Post content
   - Media URLs array
   - Media type (image/video/album)
4. Scheduler tự động publish theo lịch
```

---

## 📊 Media Type Logic

```typescript
function determineMediaType(media: UploadedMedia[]): MediaType {
  if (media.length === 0) return 'none';
  
  const hasVideo = media.some(m => m.mediaType === 'video');
  const hasImage = media.some(m => m.mediaType === 'image');
  
  if (hasVideo) return 'video';        // Video có ưu tiên cao nhất
  if (media.length > 1) return 'album'; // Nhiều ảnh = album
  if (hasImage) return 'image';        // 1 ảnh
  
  return 'none';
}
```

---

## 🔒 File Validation

### Client-Side (MediaUploader)
```typescript
// File types
Images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
Videos: ['video/mp4', 'video/quicktime', 'video/x-msvideo']

// File sizes (checked before upload)
Images: 10MB max
Videos: 100MB max
```

### Server-Side (Upload API)
```typescript
// Additional validation
- File type verification
- File size limits
- User authentication
- Storage quota check (future)
```

---

## 🛠️ Environment Variables

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://xgjrcyutjxidwxrzfqda.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Facebook (required)
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
```

---

## 🧪 Testing Checklist

### Upload API
- [x] Upload image file → Returns public URL
- [x] Upload video file → Returns public URL
- [x] File too large → Returns error
- [x] Invalid file type → Returns error
- [x] Delete uploaded file → Removes from storage

### MediaUploader Component
- [x] Drag & drop image → Shows preview
- [x] Drag & drop video → Shows video icon
- [x] Multiple files → All upload successfully
- [x] Remove file → Deletes from storage
- [x] Max files limit → Shows error toast

### ContentEditor Component
- [x] Select text + Bold → Converts to Unicode bold
- [x] Select text + Italic → Converts to Unicode italic
- [x] Click emoji → Inserts at cursor
- [x] Character counter → Shows correct count
- [x] Max length → Prevents typing over limit

### Facebook Publishing
- [x] Text-only post → Publishes to /feed
- [x] Single image post → Uploads photo + publishes
- [x] Multiple images → Creates album post
- [x] Video post → Uploads video + publishes
- [x] Scheduled post → Sets publish_time

---

## 📝 Migration Guide

### Database Migration
```bash
# Run migration
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.xgjrcyutjxidwxrzfqda \
     -d postgres \
     -f migrations/add-media-columns.sql
```

### Code Updates
```bash
# Install new packages
npm install @emoji-mart/data @emoji-mart/react

# Replace old ImageUpload with MediaUploader
# Update ComposeModal imports
```

---

## 🐛 Troubleshooting

### Upload fails với "Bucket not found"
```typescript
// Solution: Auto-create buckets trong upload API
const { data: buckets } = await supabase.storage.listBuckets();
if (!buckets.some(b => b.name === bucketName)) {
  await supabase.storage.createBucket(bucketName, { public: true });
}
```

### Facebook API error "Invalid file_url"
```typescript
// Solution: Ensure Supabase URLs are publicly accessible
// Check bucket policy: public = true
```

### Unicode formatting không hiển thị
```typescript
// Solution: Ensure font hỗ trợ Mathematical Alphanumeric Symbols
// Most modern browsers support natively
```

---

## 🚀 Future Enhancements

### Phase 2 (Upcoming)
- [ ] Image editing (crop, resize, filters)
- [ ] Video trimming & thumbnail selection
- [ ] Multiple video upload
- [ ] GIF support
- [ ] Direct camera capture
- [ ] Stock photo library integration

### Phase 3
- [ ] Instagram photo/video publishing
- [ ] TikTok video publishing
- [ ] AI-powered image generation
- [ ] Automatic alt-text generation
- [ ] Content moderation

---

## 📚 Related Documentation

- [FACEBOOK_APP_SETUP.md](./FACEBOOK_APP_SETUP.md) - Facebook App configuration
- [FACEBOOK_PERMISSIONS_GUIDE.md](./FACEBOOK_PERMISSIONS_GUIDE.md) - Required permissions
- [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md) - Full system setup

---

## ✅ Summary

**Completed Features:**
1. ✅ Media upload API with Supabase Storage
2. ✅ MediaUploader component (drag-drop, preview)
3. ✅ ContentEditor with Unicode formatting + emoji
4. ✅ Database schema update (media_type column)
5. ✅ ComposeModal integration
6. ✅ Facebook photo publishing
7. ✅ Facebook video publishing
8. ✅ Facebook album publishing

**Key Files:**
- `src/app/api/media/upload/route.ts` - Upload API
- `src/components/ui/MediaUploader.tsx` - Upload component
- `src/components/ui/ContentEditor.tsx` - Text editor
- `src/components/features/ComposeModal.tsx` - Main modal
- `src/lib/social-publishers.ts` - Facebook publisher
- `migrations/add-media-columns.sql` - Database migration

**Migration:** `migrations/add-media-columns.sql` ✅ Applied successfully

**Status:** 🎉 **PRODUCTION READY**

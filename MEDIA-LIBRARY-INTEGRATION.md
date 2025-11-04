# 📚 Media Library Integration - Complete Guide

## ✅ Tích hợp hoàn thành

Media Library đã được **tích hợp trực tiếp vào Compose Page** thay vì tạo page riêng biệt.

---

## 📋 Các file đã tạo/cập nhật

### 1. Database Migration
**File:** `migrations/create-media-table.sql`
- Tạo bảng `autopostvn_media` với đầy đủ columns cho lifecycle management
- Indexes để tối ưu performance
- RLS policies để bảo mật data
- Auto-update `updated_at` trigger

### 2. API Upload Enhancement
**File:** `src/app/api/media/upload/route.ts`
- **Cập nhật:** Sau khi upload file lên Supabase Storage, tự động insert record vào `autopostvn_media`
- Lưu metadata: `file_name`, `file_type`, `file_size`, `media_type`, `public_url`, `status`, etc.

### 3. Media Library Picker Component
**File:** `src/components/features/media/MediaLibraryPicker.tsx`
- Modal component cho phép user chọn media đã upload trước đó
- **Features:**
  - Grid/List view toggle
  - Search theo tên file hoặc tags
  - Filter theo status (uploaded, published, archived)
  - Multi-select với giới hạn maxSelect
  - Preview thumbnail (ảnh) hoặc video icon
  - Selection checkbox với visual feedback
  - Responsive design

### 4. Compose Center Panel Integration
**File:** `src/components/features/compose/ComposeCenterPanel.tsx`
- **Thêm:** Nút "Thư viện" bên cạnh MediaUploader
- **Thêm:** State `showMediaPicker` để control modal
- **Thêm:** Handler `handleMediaFromLibrary()` để nhận media từ library
- **Import:** `MediaLibraryPicker`, `FolderOpen` icon

### 5. Files đã xóa
- ❌ `src/app/media/page.tsx` - Page riêng không cần thiết
- ❌ `src/app/media/` folder
- ❌ `src/components/features/media/MediaLibrary.tsx` - Standalone component
- ❌ Media tab trong Sidebar

---

## 🚀 Hướng dẫn Setup (5 phút)

### Bước 1: Chạy Migration
```sql
-- Mở Supabase Dashboard > SQL Editor
-- Copy & paste nội dung từ: migrations/create-media-table.sql
-- Click RUN
```

**Kiểm tra:**
```sql
-- Verify table created
SELECT * FROM autopostvn_media LIMIT 1;

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'autopostvn_media';
```

### Bước 2: Tạo Storage Buckets (nếu chưa có)
Buckets cần thiết:
- `post-images` - Cho hình ảnh
- `post-videos` - Cho videos

**Cách tạo:**
1. Supabase Dashboard > Storage
2. Click "New bucket"
3. Name: `post-images`, Public: ✅ (enabled)
4. Click "Create bucket"
5. Lặp lại cho `post-videos`

### Bước 3: Cài đặt môi trường
File `.env.local` phải có:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Bước 4: Build & Test
```bash
npm run build
npm run dev
```

---

## 🎯 Cách sử dụng

### 1. Upload Media mới
1. Vào **Compose Page** (`/compose`)
2. Scroll xuống section "Hình ảnh & Video"
3. Click vào khu vực upload hoặc drag & drop files
4. Files sẽ được upload lên Supabase Storage **VÀ** lưu vào database `autopostvn_media`

### 2. Chọn Media từ Thư viện
1. Vào **Compose Page**
2. Click nút **"🗂️ Thư viện"** bên cạnh MediaUploader
3. Modal "Thư viện Media" mở ra với:
   - **Search bar:** Tìm theo tên file hoặc tags
   - **View toggle:** Grid (lưới) hoặc List (danh sách)
   - **Filter:** Theo status (uploaded, published, archived)
   - **Select:** Click vào media để chọn (có checkbox visual)
4. Click **"Chọn (X)"** để apply
5. Media được thêm vào compose form như upload mới

### 3. Quản lý Media
- **Grid View:** Hiển thị thumbnails với type badge (🖼️/🎬)
- **List View:** Hiển thị chi tiết (tên, loại, kích thước, ngày tạo)
- **Multi-select:** Chọn nhiều media cùng lúc (giới hạn theo `maxSelect`)
- **Search:** Gõ tên file hoặc tag để lọc

---

## 🔍 API Endpoints được sử dụng

### POST `/api/media/upload`
Upload file + tạo record trong database
```typescript
// Request: FormData with 'file'
// Response:
{
  success: true,
  file: {
    id: "uuid",        // Media ID trong database
    name: "photo.jpg",
    type: "image/jpeg",
    size: 123456,
    url: "https://...",
    path: "user_id/timestamp-random.jpg",
    bucket: "post-images",
    mediaType: "image"
  }
}
```

### GET `/api/media`
Lấy danh sách media
```typescript
// Query params:
// - mediaType: 'image' | 'video' (optional)
// - status: 'uploaded' | 'published' | 'archived' (optional)
// - limit: number (default: 100)
// - search: string (optional)
// - tags: string[] (optional)

// Response:
{
  media: MediaItem[],
  total: number,
  hasMore: boolean
}
```

---

## 📊 Database Schema

```sql
CREATE TABLE autopostvn_media (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id UUID,
  
  -- File information
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  media_type VARCHAR(20), -- 'image' | 'video'
  
  -- Storage
  bucket TEXT DEFAULT 'media',
  public_url TEXT NOT NULL,
  
  -- Lifecycle
  status VARCHAR(20) DEFAULT 'uploaded', -- 'uploaded' | 'processing' | 'published' | 'archived' | 'deleted'
  published_at TIMESTAMP,
  archived_at TIMESTAMP,
  deleted_at TIMESTAMP,
  
  -- Analytics
  engagement_score INTEGER DEFAULT 0,
  platform_urls JSONB DEFAULT '{}',
  
  -- Organization
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎨 UI Flow

```
┌─────────────────────────────────────────────────────┐
│           Compose Page (/compose)                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📝 Content Editor                                   │
│  ┌──────────────────────────────────────────────┐  │
│  │ Tiêu đề bài viết...                           │  │
│  │ Nội dung bài viết...                          │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  🖼️ Hình ảnh & Video                                │
│  ┌──────────────────────┐  ┌──────────────────┐   │
│  │   📤 Upload mới      │  │  🗂️ Thư viện    │   │
│  │   (MediaUploader)    │  │  (Open Picker)   │   │
│  └──────────────────────┘  └──────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘

                        ⬇️ Click "Thư viện"

┌─────────────────────────────────────────────────────┐
│        🎬 Thư viện Media (Modal)                     │
├─────────────────────────────────────────────────────┤
│  🔍 [Search...] 📊 Grid/List 🎛️ Filters            │
├─────────────────────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│  │ ✓  │ │    │ │ ✓  │ │    │ │    │  (Grid View) │
│  │📷  │ │🎬  │ │📷  │ │📷  │ │🎬  │               │
│  └────┘ └────┘ └────┘ └────┘ └────┘               │
│  photo1 video1 photo2 photo3 video2                 │
│                                                      │
│  ✓ Đã chọn: 2                                       │
│  [Hủy]              [Chọn (2)]                      │
└─────────────────────────────────────────────────────┘
```

---

## ✨ Features

### ✅ Đã hoàn thành
- [x] Database schema với lifecycle management
- [x] API upload tự động lưu vào database
- [x] MediaLibraryPicker component (modal)
- [x] Tích hợp vào Compose Page
- [x] Grid/List view toggle
- [x] Search & Filter
- [x] Multi-select với giới hạn
- [x] Visual feedback (checkbox, hover states)
- [x] Responsive design
- [x] TypeScript types đầy đủ
- [x] Xóa page `/media` không cần thiết

### 🔮 Tương lai (nếu cần)
- [ ] Preview modal trong MediaLibraryPicker (hiện tại đã bỏ để đơn giản)
- [ ] Tag management trong picker
- [ ] Bulk actions (xóa nhiều, thêm tags hàng loạt)
- [ ] Pagination cho >100 media
- [ ] Advanced filters (date range, file size, etc.)
- [ ] Drag & drop reorder
- [ ] Favorites/Pin media

---

## 🐛 Troubleshooting

### Lỗi: "Cannot read properties of undefined (reading 'media')"
**Nguyên nhân:** API `/api/media` chưa trả về hoặc bảng `autopostvn_media` chưa tồn tại
**Giải pháp:** Chạy migration tạo bảng

### Lỗi: "Bucket not found"
**Nguyên nhân:** Chưa tạo buckets `post-images` hoặc `post-videos`
**Giải pháp:** Tạo buckets trong Supabase Dashboard > Storage

### Lỗi: "No rows returned" khi upload
**Nguyên nhân:** RLS policies chặn insert
**Giải pháp:** 
- Kiểm tra user đã login chưa
- Verify RLS policies trong migration đã chạy đúng

### Media không hiển thị trong Library
**Nguyên nhân:** Upload cũ chưa có record trong `autopostvn_media`
**Giải pháp:** 
- Upload lại (hoặc)
- Tạo script backfill data cũ vào database

---

## 📦 Dependencies

Không cần cài thêm package nào! Đã sử dụng:
- `lucide-react` - Icons (đã có)
- `@supabase/supabase-js` - Database & Storage (đã có)
- React hooks - State management (built-in)

---

## 🎯 Summary

**Những gì đã thay đổi:**
1. ✅ Tạo bảng `autopostvn_media` để lưu trữ media lifecycle
2. ✅ API upload tự động insert record vào database
3. ✅ Tạo MediaLibraryPicker component (modal)
4. ✅ Tích hợp vào Compose Page với nút "Thư viện"
5. ✅ Xóa page `/media` standalone

**Workflow:**
```
Upload Media → Storage + Database → Library → Reuse trong Compose
```

**User Experience:**
- Upload lần đầu → Lưu vào library
- Lần sau → Chọn từ library (không upload lại)
- Tiết kiệm thời gian + bandwidth
- Quản lý tập trung tất cả media

---

## 📞 Support

Nếu gặp vấn đề:
1. Check migration đã chạy chưa: `SELECT * FROM autopostvn_media LIMIT 1;`
2. Check buckets đã tạo chưa: Supabase Dashboard > Storage
3. Check console log trong browser DevTools
4. Check API response trong Network tab

**Happy posting! 🚀**

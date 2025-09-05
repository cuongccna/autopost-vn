# Chức năng Upload Ảnh - AutoPost VN

## ✨ Tổng quan
Hệ thống upload ảnh cho chức năng "Tạo bài đăng" với khả năng kéo-thả (drag & drop), tích hợp Supabase Storage để lưu trữ và quản lý hình ảnh.

## 🚀 Tính năng chính

### 📤 Upload Ảnh
- **Kéo-thả**: Hỗ trợ drag & drop ảnh vào khung upload
- **Click để chọn**: Có thể click để mở dialog chọn file
- **Định dạng hỗ trợ**: PNG, JPG, JPEG, WEBP
- **Giới hạn**: Tối đa 4 ảnh, mỗi ảnh tối đa 5MB
- **Preview**: Hiển thị thumbnail ngay sau khi chọn
- **Progress**: Thanh tiến trình upload cho từng ảnh
- **Error handling**: Thông báo lỗi chi tiết

### 🖼️ Hiển thị Ảnh
- **Post Detail Modal**: Hiển thị grid ảnh trong modal chi tiết bài đăng
- **Hover effects**: Hiệu ứng hover với nút xem ảnh lớn
- **Click to view**: Click để mở ảnh trong tab mới

### 🗄️ Lưu trữ
- **Supabase Storage**: Sử dụng bucket "post-images"
- **Auto-bucket creation**: Tự động tạo bucket nếu chưa tồn tại
- **Public URL**: Ảnh có thể truy cập công khai qua URL
- **Organized storage**: File được tổ chức theo userId và timestamp

## 📁 Cấu trúc File

### Core Components
```
src/
├── components/
│   └── ui/
│       └── ImageUpload.tsx          # Component upload ảnh
├── lib/
│   └── supabase/
│       └── storage.ts               # Utilities cho Supabase Storage
└── app/
    └── api/
        └── storage/
            └── init/
                └── route.ts         # API endpoint khởi tạo storage
```

### Enhanced Components
```
src/components/features/
├── ComposeModal.tsx                 # Modal tạo bài đăng (đã tích hợp upload)
├── PostDetailModal.tsx              # Modal chi tiết bài đăng (hiển thị ảnh)
└── Calendar.tsx                     # Calendar component (cập nhật interface)
```

## 🔧 Cấu hình

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Bucket Settings
```typescript
Bucket Name: "post-images"
Public: true
Allowed MIME Types: image/png, image/jpeg, image/jpg, image/webp
File Size Limit: 5MB (5,242,880 bytes)
```

## 💻 Cách sử dụng

### 1. Trong ComposeModal
```typescript
// Component tự động được tích hợp
<ImageUpload
  userId={session.user.id}
  maxImages={4}
  onImagesChange={setUploadedImages}
/>
```

### 2. Upload Functions
```typescript
// Upload một ảnh
const result = await uploadImage(file, userId)

// Xóa ảnh
const result = await deleteImage(imagePath)

// Khởi tạo storage
const result = await initializeStorage()
```

### 3. Post Data Structure
```typescript
interface Post {
  id: string
  title: string
  content?: string
  mediaUrls?: string[]  // ← URLs của ảnh đã upload
  // ... other fields
}
```

## 🔄 Flow hoạt động

### Upload Process
1. **Chọn ảnh**: User kéo-thả hoặc click chọn ảnh
2. **Validation**: Kiểm tra định dạng, kích thước, số lượng
3. **Upload**: Upload lên Supabase Storage
4. **Preview**: Hiển thị thumbnail với progress bar
5. **Store URLs**: Lưu public URLs vào state
6. **Submit**: Gửi URLs cùng với form data

### Display Process
1. **Create Post**: mediaUrls được lưu trong database
2. **View Post**: Load URLs từ database
3. **Display**: Hiển thị ảnh trong PostDetailModal
4. **Interact**: Click để xem ảnh lớn

## 🛠️ API Endpoints

### Storage Management
```
POST /api/storage/init     # Khởi tạo bucket storage
GET  /api/storage/init     # Lấy thông tin storage config
```

### Posts với Media
```
POST /api/posts           # Tạo bài đăng (hỗ trợ media_urls)
PUT  /api/posts/[id]      # Cập nhật bài đăng (hỗ trợ media_urls)
```

## 🎨 UI/UX Features

### Upload Area
- **Dashed border**: Khung kéo-thả với viền đứt nét
- **Drag states**: Thay đổi style khi kéo ảnh vào
- **Icons**: Icon upload và mô tả rõ ràng
- **Responsive**: Hoạt động tốt trên mobile

### Preview Grid
- **Thumbnails**: Hiển thị ảnh nhỏ 80x80px
- **Progress bars**: Thanh tiến trình cho mỗi ảnh
- **Remove buttons**: Nút X để xóa ảnh
- **Grid layout**: Sắp xếp dạng lưới 2 cột

### Post Detail View
- **Image grid**: Hiển thị ảnh dạng lưới 2 cột
- **Hover effects**: Hiệu ứng hover với overlay
- **View button**: Nút phóng to ảnh
- **Responsive**: Thích ứng với màn hình nhỏ

## 🔒 Bảo mật

### Validation
- **File type**: Chỉ cho phép ảnh
- **File size**: Giới hạn 5MB/ảnh
- **Quantity**: Tối đa 4 ảnh/bài đăng
- **Authentication**: Yêu cầu đăng nhập để upload

### Storage Security
- **Public bucket**: Ảnh có thể truy cập công khai
- **User organization**: File được tổ chức theo userId
- **Unique naming**: Tên file unique để tránh conflict

## 🧪 Testing

### Manual Testing
1. **Kéo-thả ảnh**: Test drag & drop functionality
2. **Click upload**: Test file selection dialog
3. **Validation**: Test với file không hợp lệ
4. **Progress**: Kiểm tra progress bar
5. **Preview**: Test hiển thị thumbnail
6. **Submit**: Test tạo bài đăng với ảnh
7. **Display**: Test hiển thị ảnh trong PostDetailModal

### Error Cases
- File quá lớn (>5MB)
- Định dạng không hỗ trợ
- Vượt quá 4 ảnh
- Lỗi mạng khi upload
- Bucket không tồn tại

## 📋 TODO / Improvements

### Short-term
- [ ] Image compression trước khi upload
- [ ] Lazy loading cho ảnh trong post detail
- [ ] Bulk delete multiple images
- [ ] Image editing (crop, rotate)

### Long-term
- [ ] CDN integration cho performance
- [ ] Image optimization pipeline
- [ ] Video upload support
- [ ] AI-powered image tagging
- [ ] Analytics tracking cho media usage

## 🎯 Performance

### Optimizations
- **Lazy upload**: Upload từng ảnh một, không block UI
- **Thumbnail generation**: Tạo thumbnail cho preview
- **Progress tracking**: Real-time progress feedback
- **Error resilience**: Retry logic cho failed uploads

### Monitoring
- Upload success/failure rates
- Average upload times
- Storage usage tracking
- User engagement với media posts

---

## 🎉 Kết luận

Chức năng upload ảnh đã được tích hợp hoàn chỉnh vào AutoPost VN với:
- ✅ UI/UX thân thiện với drag & drop
- ✅ Tích hợp Supabase Storage
- ✅ Validation và error handling
- ✅ Preview và progress tracking
- ✅ Hiển thị ảnh trong post detail
- ✅ Mobile responsive

Người dùng giờ có thể dễ dàng thêm ảnh vào bài đăng và xem chúng trong giao diện quản lý bài đăng.

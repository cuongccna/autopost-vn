# Instagram REELS Migration - URGENT FIX

## 🚨 CRITICAL CHANGE

Instagram đã **DEPRECATED** `media_type: VIDEO` từ 2024 và bắt buộc sử dụng `media_type: REELS` cho video content.

### Error trước khi fix:
```json
{
  "error": {
    "code": 100,
    "error_subcode": 2207067,
    "message": "Invalid parameter",
    "error_user_msg": "Giá trị VIDEO của media_type không được hỗ trợ nữa. Hãy sử dụng loại file phương tiện THƯỚC PHIM để đăng video lên bảng feed Instagram của bạn.",
    "error_user_title": "Loại file phương tiện VIDEO không được hỗ trợ"
  }
}
```

## ✅ ĐÃ SỬA

### File: `src/lib/social-publishers.ts`

#### Change 1: Single Video Post (Lines ~487-498)
```typescript
// ❌ CŨ - DEPRECATED
if (isVideo) {
  mediaData.media_type = 'VIDEO';
  mediaData.video_url = data.mediaUrls[0];
}

// ✅ MỚI - HOẠT ĐỘNG
if (isVideo) {
  mediaData.media_type = 'REELS';  // Changed from VIDEO to REELS
  mediaData.video_url = data.mediaUrls[0];
  mediaData.share_to_feed = true;  // Also post to main feed
}
```

#### Change 2: Error Handling (Lines ~753-774)
Thêm xử lý cho error subcode 2207067:
```typescript
case 100:
  if (error_subcode === 2207067) {
    return 'Instagram không còn hỗ trợ media_type VIDEO. Vui lòng cập nhật app để sử dụng REELS cho video.';
  }
  return error_user_msg || 'Thông số không hợp lệ...';
```

#### Change 3: Logging
Thêm logging để debug:
```typescript
console.log('🎬 Preparing REELS container:', {
  video_url: data.mediaUrls[0],
  media_type: 'REELS',
  share_to_feed: true
});
```

## 📝 LƯU Ý QUAN TRỌNG

### Carousel Videos
**KHÔNG THAY ĐỔI** - Carousel items vẫn dùng `media_type: VIDEO`:
```typescript
// ✅ ĐÚNG cho carousel items
if (isVideo) {
  mediaData.media_type = 'VIDEO';  // Still use VIDEO for carousel
  mediaData.video_url = mediaUrl;
  mediaData.is_carousel_item = true;
}
```

### Video Requirements cho REELS
- **Duration**: 3-90 seconds (15 minutes for verified)
- **Format**: MP4, MOV
- **Resolution**: Min 540x960, Max 1080x1920
- **Aspect Ratio**: 9:16 (vertical), 4:5, 1:1, 16:9
- **File Size**: Max 100MB
- **Frame Rate**: Max 60 FPS

## 🧪 TESTING

### Test Case 1: Single Video Post
```javascript
const publishData = {
  content: 'Test video reel',
  mediaUrls: ['https://cdn.example.com/video.mp4'],
  scheduledAt: null
};

// Expected: Success with REELS media_type
```

### Test Case 2: Single Image Post
```javascript
const publishData = {
  content: 'Test image',
  mediaUrls: ['https://cdn.example.com/image.jpg'],
  scheduledAt: null
};

// Expected: Success with IMAGE media_type (no change)
```

### Test Case 3: Carousel with Videos
```javascript
const publishData = {
  content: 'Test carousel',
  mediaUrls: [
    'https://cdn.example.com/image1.jpg',
    'https://cdn.example.com/video.mp4',
    'https://cdn.example.com/image2.jpg'
  ],
  scheduledAt: null
};

// Expected: Success, video items use VIDEO type for carousel
```

## 🚀 DEPLOYMENT

### Local Development
```bash
# Already applied in code
npm run dev
```

### Production
```bash
cd /var/www/autopost-vn
git pull origin main
npm run build
pm2 restart autopost-vn
pm2 logs autopost-vn --lines 50
```

## 📊 EXPECTED RESULTS

### Before Fix:
```json
{
  "success": false,
  "error": "Thông số không hợp lệ...",
  "platform_response": {
    "error": {
      "code": 100,
      "error_subcode": 2207067
    }
  }
}
```

### After Fix:
```json
{
  "success": true,
  "externalPostId": "17xxx...",
  "platformResponse": {
    "id": "17xxx..."
  },
  "metadata": {
    "mediaType": "video"
  }
}
```

## 📚 REFERENCES

- [Instagram Content Publishing API](https://developers.facebook.com/docs/instagram-api/reference/ig-user/media#creating)
- [Instagram Reels Publishing Guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [VIDEO-FORMATS-SUPPORT.md](./VIDEO-FORMATS-SUPPORT.md) - Chi tiết về video formats

## ✅ CHECKLIST

- [x] Sửa `media_type: VIDEO` → `media_type: REELS` cho single video
- [x] Thêm `share_to_feed: true` option
- [x] Giữ nguyên `VIDEO` cho carousel items
- [x] Thêm error handling cho subcode 2207067
- [x] Thêm logging cho debug
- [x] Tạo document về video formats support
- [ ] Test trên production
- [ ] Verify video publishing works

## 🎯 NEXT STEPS

1. **Deploy to production** (nếu chưa deploy)
2. **Test video upload** với file MP4
3. **Monitor logs** để verify REELS container được tạo thành công
4. **Update user documentation** về video requirements

---

**Status**: ✅ Code đã sửa, ready to deploy
**Priority**: 🚨 CRITICAL - Instagram video publishing bị broken
**Impact**: All Instagram video posts
**Fix Time**: ~5 minutes to deploy

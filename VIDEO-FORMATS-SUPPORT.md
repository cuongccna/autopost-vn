# 📹 Video Formats Support - Facebook & Instagram API 2025

## 🎬 INSTAGRAM VIDEO FORMATS

### ⚠️ IMPORTANT CHANGES (2024-2025)

Instagram đã **DEPRECATED** `media_type: VIDEO` và thay thế bằng **REELS**:

```javascript
// ❌ CŨ - Không còn hoạt động (Deprecated 2024)
{
  media_type: 'VIDEO',
  video_url: 'https://example.com/video.mp4',
  caption: 'My video'
}

// ✅ MỚI - Bắt buộc sử dụng từ 2024
{
  media_type: 'REELS',
  video_url: 'https://example.com/video.mp4',
  caption: 'My video'
}
```

### Instagram Reels Requirements

#### Video Specifications:
- **Format**: MP4, MOV
- **Codec**: H.264 video, AAC audio
- **Duration**: 
  - Minimum: 3 seconds
  - Maximum: 90 seconds (15 minutes for verified accounts)
- **Aspect Ratio**: 
  - Recommended: 9:16 (vertical)
  - Supported: 4:5, 1:1, 16:9
- **Resolution**:
  - Minimum: 540x960 pixels
  - Recommended: 1080x1920 pixels (Full HD vertical)
  - Maximum: 1080x1920 pixels
- **File Size**: 
  - Maximum: 100MB
  - Recommended: < 50MB for faster upload
- **Frame Rate**: 
  - Minimum: 23 FPS
  - Maximum: 60 FPS
  - Recommended: 30 FPS
- **Bitrate**:
  - Recommended: 3-5 Mbps
  - Maximum: 10 Mbps

#### Audio Specifications:
- **Codec**: AAC
- **Sample Rate**: 44.1 kHz or 48 kHz
- **Channels**: Stereo (2 channels) or Mono
- **Bitrate**: 128-256 kbps

#### Content Requirements:
- ✅ Must be publicly accessible URL (HTTPS)
- ✅ Must be original content
- ✅ No watermarks from other platforms (TikTok, etc.)
- ✅ Must comply with Instagram Community Guidelines
- ❌ No pre-existing Instagram Reels (cannot repost)

### Instagram Media Types (Current 2025)

```javascript
// Image
{
  media_type: 'IMAGE',
  image_url: 'https://example.com/image.jpg'
}

// Video (REELS only)
{
  media_type: 'REELS',
  video_url: 'https://example.com/video.mp4',
  share_to_feed: true  // Optional: also post to main feed
}

// Carousel (Multiple images/videos)
{
  media_type: 'CAROUSEL',
  children: ['media_id_1', 'media_id_2', ...],
  caption: 'Carousel post'
}
```

---

## 📘 FACEBOOK VIDEO FORMATS

Facebook vẫn hỗ trợ đa dạng video formats hơn Instagram.

### Facebook Video Requirements

#### Video Specifications:
- **Format**: MP4, MOV, AVI, FLV, MKV, WebM
- **Codec**: H.264, VP8, VP9
- **Duration**:
  - Minimum: 1 second
  - Maximum: 240 minutes (4 hours)
- **Aspect Ratio**:
  - Vertical: 9:16, 4:5
  - Square: 1:1
  - Landscape: 16:9
  - All ratios supported
- **Resolution**:
  - Minimum: 600x600 pixels
  - Maximum: 4K (4096x2160 pixels)
  - Recommended: 1080p (1920x1080)
- **File Size**:
  - Maximum: 10GB
  - Recommended: < 1GB
- **Frame Rate**:
  - Maximum: 60 FPS
  - Recommended: 30 FPS
- **Bitrate**:
  - Recommended: 4-8 Mbps for 1080p

#### Audio Specifications:
- **Codec**: AAC, MP3
- **Sample Rate**: Up to 48 kHz
- **Channels**: Stereo or Mono
- **Bitrate**: 128-320 kbps

#### Content Types:
- ✅ Regular video posts
- ✅ Stories (max 15 seconds per segment)
- ✅ Reels (max 90 seconds)
- ✅ Live videos (different API)

### Facebook Media Types

```javascript
// Image
{
  url: 'https://example.com/image.jpg',
  published: true
}

// Video
{
  file_url: 'https://example.com/video.mp4',
  title: 'My Video',
  description: 'Video description'
}

// Multiple photos (Album)
{
  attached_media: [
    { media_fbid: 'photo_id_1' },
    { media_fbid: 'photo_id_2' }
  ],
  message: 'Album caption'
}
```

---

## 📊 COMPARISON TABLE

| Feature | Instagram Reels | Facebook Video |
|---------|----------------|----------------|
| **Max Duration** | 90 sec (15 min verified) | 240 min (4 hours) |
| **Max File Size** | 100 MB | 10 GB |
| **Max Resolution** | 1080x1920 | 4096x2160 (4K) |
| **Aspect Ratios** | 9:16, 4:5, 1:1, 16:9 | All ratios |
| **Formats** | MP4, MOV | MP4, MOV, AVI, FLV, MKV, WebM |
| **Frame Rate** | 60 FPS max | 60 FPS max |
| **Audio Required** | Optional | Optional |

---

## 🎯 SUPPORTED VIDEO EXTENSIONS

### Instagram (Reels):
```javascript
const INSTAGRAM_VIDEO_EXTENSIONS = [
  '.mp4',   // ✅ Preferred
  '.mov',   // ✅ Supported
];

const INSTAGRAM_VIDEO_MIMETYPES = [
  'video/mp4',        // ✅ Preferred
  'video/quicktime',  // ✅ MOV files
];
```

### Facebook:
```javascript
const FACEBOOK_VIDEO_EXTENSIONS = [
  '.mp4',   // ✅ Preferred
  '.mov',   // ✅ Supported
  '.avi',   // ✅ Supported
  '.flv',   // ✅ Supported (Flash Video)
  '.mkv',   // ✅ Supported (Matroska)
  '.webm',  // ✅ Supported (WebM)
];

const FACEBOOK_VIDEO_MIMETYPES = [
  'video/mp4',              // ✅ Preferred
  'video/quicktime',        // ✅ MOV
  'video/x-msvideo',        // ✅ AVI
  'video/x-flv',            // ✅ FLV
  'video/x-matroska',       // ✅ MKV
  'video/webm',             // ✅ WebM
];
```

---

## 🛠️ VIDEO CONVERSION RECOMMENDATIONS

### For Instagram Reels:
```bash
# Convert to Instagram-compatible format using FFmpeg
ffmpeg -i input.mp4 \
  -c:v libx264 -preset slow -crf 22 \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
  -c:a aac -b:a 128k -ar 44100 \
  -r 30 -t 90 \
  -movflags +faststart \
  output_reels.mp4
```

### For Facebook:
```bash
# Convert to Facebook-compatible format
ffmpeg -i input.mp4 \
  -c:v libx264 -preset medium -crf 23 \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease" \
  -c:a aac -b:a 192k -ar 48000 \
  -r 30 \
  -movflags +faststart \
  output_facebook.mp4
```

---

## 📝 API USAGE EXAMPLES

### Instagram Reels Publishing (2025):

```javascript
// Step 1: Create Reels container
const createContainer = await fetch(
  `https://graph.facebook.com/v18.0/${ig_user_id}/media`,
  {
    method: 'POST',
    body: JSON.stringify({
      media_type: 'REELS',              // ✅ REQUIRED
      video_url: 'https://cdn.example.com/video.mp4',
      caption: 'Check out this reel!',
      share_to_feed: true,              // Optional: post to main feed too
      access_token: access_token
    })
  }
);

// Step 2: Wait for video processing (may take 30-60 seconds)
// Check status: GET /{container_id}?fields=status_code

// Step 3: Publish the container
const publish = await fetch(
  `https://graph.facebook.com/v18.0/${ig_user_id}/media_publish`,
  {
    method: 'POST',
    body: JSON.stringify({
      creation_id: container_id,
      access_token: access_token
    })
  }
);
```

### Facebook Video Publishing:

```javascript
// Direct upload to Facebook Page
const response = await fetch(
  `https://graph.facebook.com/v18.0/${page_id}/videos`,
  {
    method: 'POST',
    body: JSON.stringify({
      file_url: 'https://cdn.example.com/video.mp4',
      title: 'My Video Title',
      description: 'Video description',
      access_token: page_access_token
    })
  }
);
```

---

## ⚠️ COMMON ERRORS & FIXES

### Instagram Error: "media_type VIDEO is no longer supported"

**Error Code**: 100, subcode 2207067

**Cause**: Using deprecated `media_type: VIDEO`

**Fix**:
```javascript
// ❌ Wrong
{ media_type: 'VIDEO', video_url: url }

// ✅ Correct
{ media_type: 'REELS', video_url: url }
```

### Instagram Error: "Video too long"

**Cause**: Video > 90 seconds (or 15 minutes for non-verified)

**Fix**: Trim video to max duration:
```bash
ffmpeg -i input.mp4 -t 90 -c copy output.mp4
```

### Facebook Error: "Video file size too large"

**Cause**: File > 10GB

**Fix**: Compress video:
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 28 -c:a aac output.mp4
```

---

## 📚 REFERENCES

- [Instagram Content Publishing API](https://developers.facebook.com/docs/instagram-api/reference/ig-user/media)
- [Instagram Reels Publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Facebook Video API](https://developers.facebook.com/docs/video-api)
- [Video Requirements - Instagram](https://help.instagram.com/1469029763400082)
- [Video Specifications - Facebook](https://www.facebook.com/help/218673814818907)

---

## 🔄 MIGRATION GUIDE (VIDEO → REELS)

### Old Code (Deprecated):
```javascript
{
  media_type: 'VIDEO',
  video_url: videoUrl,
  caption: caption
}
```

### New Code (2025):
```javascript
{
  media_type: 'REELS',
  video_url: videoUrl,
  caption: caption,
  share_to_feed: true  // Optional: also show in main feed
}
```

### Code Changes Required:
1. Update all `media_type: 'VIDEO'` to `media_type: 'REELS'`
2. Add video duration validation (max 90 seconds)
3. Add aspect ratio check (prefer 9:16)
4. Update error handling for new error codes

---

**Last Updated**: November 2025
**API Version**: Facebook Graph API v18.0+

# Image Validation Testing Guide

## 📋 Prerequisites

### 1. Install FFmpeg

**Windows:**
```powershell
# Using winget (recommended)
winget install Gyan.FFmpeg

# Using Chocolatey
choco install ffmpeg

# Verify installation
ffmpeg -version
ffprobe -version
```

**Linux:**
```bash
sudo apt update
sudo apt install ffmpeg

# Verify
ffmpeg -version
```

**macOS:**
```bash
brew install ffmpeg

# Verify
ffmpeg -version
```

---

## 🧪 Test Scenarios

### Scenario 1: Perfect Image (No optimization needed)

**Test Image:** 1080 x 1080, JPG, 800KB

**Create test image:**
```bash
# Create a perfect square image
ffmpeg -f lavfi -i color=c=blue:s=1080x1080:d=1 -frames:v 1 -q:v 5 test_perfect_1080x1080.jpg
```

**Expected Result:**
```json
{
  "success": true,
  "optimized": false,
  "validation": {
    "instagram": {
      "valid": true,
      "errors": [],
      "warnings": []
    },
    "facebook": {
      "valid": true,
      "errors": [],
      "warnings": []
    }
  }
}
```

**Console Logs:**
```
🖼️ [IMAGE VALIDATE] Analyzing image...
📐 [IMAGE VALIDATE] Image info: 1080x1080, jpeg, 1.00 aspect ratio
✅ [IMAGE VALIDATE] Instagram validation: valid
✅ [IMAGE VALIDATE] Facebook validation: valid
✅ [IMAGE VALIDATE] Image already optimal, no optimization needed
```

---

### Scenario 2: High Resolution (Needs resizing)

**Test Image:** 4000 x 3000, JPG, 5MB

**Create test image:**
```bash
# Create high-resolution landscape image
ffmpeg -f lavfi -i color=c=red:s=4000x3000:d=1 -frames:v 1 -q:v 2 test_highres_4000x3000.jpg
```

**Expected Result:**
```json
{
  "success": true,
  "optimized": true,
  "validation": {
    "instagram": {
      "valid": true,
      "errors": [],
      "warnings": [
        "Resolution 4000x3000 exceeds Instagram's max 1080x1350. Will be resized to 1080px width."
      ]
    }
  }
}
```

**Console Logs:**
```
🖼️ [IMAGE VALIDATE] Analyzing image...
📐 [IMAGE VALIDATE] Image info: 4000x3000, jpeg, 1.33 aspect ratio
⚠️ [IMAGE VALIDATE] Instagram validation: needs optimization
🔄 [IMAGE OPTIMIZE] Optimization required...
✅ [IMAGE OPTIMIZE] Optimization complete
🎉 [IMAGE OPTIMIZE] Image optimized successfully: 5242880 → 856234 (83.7% savings)
```

---

### Scenario 3: File Too Large (Needs compression)

**Test Image:** 1080 x 1080, JPG, 12MB

**Create test image:**
```bash
# Create large file size image (low compression)
ffmpeg -f lavfi -i testsrc=s=1080x1080:d=1 -frames:v 1 -q:v 1 test_large_1080x1080.jpg
```

**Expected Result:**
```json
{
  "success": true,
  "optimized": true,
  "validation": {
    "instagram": {
      "valid": true,
      "errors": [],
      "warnings": []
    }
  }
}
```

**Console Logs:**
```
🖼️ [IMAGE VALIDATE] Analyzing image...
📏 [IMAGE VALIDATE] Size check: 12582912 bytes exceeds 8388608
🔄 [IMAGE OPTIMIZE] Compressing image...
🎉 [IMAGE OPTIMIZE] Image optimized: 12MB → 1.2MB (90% savings)
```

---

### Scenario 4: GIF Format (Instagram incompatible)

**Test Image:** GIF (animated or static)

**Create test GIF:**
```bash
# Create simple GIF
ffmpeg -f lavfi -i testsrc=s=800x600:d=1 -frames:v 1 test_image.gif
```

**Expected Result:**
```json
{
  "success": true,
  "optimized": true,
  "validation": {
    "instagram": {
      "valid": false,
      "errors": [
        "GIF format not supported for Instagram feed posts. Convert to JPG or PNG."
      ],
      "warnings": []
    }
  }
}
```

**Console Logs:**
```
🖼️ [IMAGE VALIDATE] Analyzing image...
❌ [IMAGE VALIDATE] Instagram validation: GIF not supported
🔄 [IMAGE OPTIMIZE] Converting GIF to JPG...
✅ [IMAGE OPTIMIZE] Conversion complete
```

---

### Scenario 5: Invalid Aspect Ratio

**Test Image:** 3000 x 500 (6:1 - too wide)

**Create test image:**
```bash
# Create ultra-wide image
ffmpeg -f lavfi -i color=c=green:s=3000x500:d=1 -frames:v 1 -q:v 5 test_ultrawide_3000x500.jpg
```

**Expected Result:**
```json
{
  "success": false,
  "optimized": false,
  "validation": {
    "instagram": {
      "valid": false,
      "errors": [
        "Aspect ratio 6.00:1 not supported. Must be between 0.8:1 (4:5) and 1.91:1 (landscape)"
      ],
      "warnings": []
    }
  }
}
```

**Console Logs:**
```
🖼️ [IMAGE VALIDATE] Analyzing image...
❌ [IMAGE VALIDATE] Instagram validation: aspect ratio 6.00 out of range
⚠️ [IMAGE VALIDATE] Cannot auto-fix aspect ratio, manual cropping required
```

---

### Scenario 6: Portrait 4:5 (Instagram optimal)

**Test Image:** 1080 x 1350, JPG

**Create test image:**
```bash
# Create 4:5 portrait image
ffmpeg -f lavfi -i color=c=purple:s=1080x1350:d=1 -frames:v 1 -q:v 5 test_portrait_1080x1350.jpg
```

**Expected Result:**
```json
{
  "success": true,
  "optimized": false,
  "validation": {
    "instagram": {
      "valid": true,
      "errors": [],
      "warnings": []
    }
  }
}
```

---

## 🌐 UI Testing

### Test via Upload Form

1. **Open compose page:**
   ```
   http://localhost:3000/compose
   ```

2. **Upload test images** from scenarios above

3. **Check console logs** in browser DevTools

4. **Verify uploaded URL** is accessible

### Expected UI Behavior

✅ **Success Upload:**
- Toast notification: "✅ Image uploaded successfully"
- Image appears in media list
- No error messages

⚠️ **Optimized Upload:**
- Toast notification: "✅ Image optimized and uploaded"
- Console shows optimization details
- Smaller file size in response

❌ **Failed Upload:**
- Toast notification: "❌ Upload failed: [error message]"
- Validation errors displayed
- Suggestions for fixing

---

## 🔧 API Testing

### Using cURL

**Upload perfect image:**
```bash
curl -X POST http://localhost:3000/api/media/upload \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -F "file=@test_perfect_1080x1080.jpg"
```

**Upload high-res image:**
```bash
curl -X POST http://localhost:3000/api/media/upload \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -F "file=@test_highres_4000x3000.jpg" \
  -v
```

**Check response:**
```json
{
  "success": true,
  "optimized": true,
  "validation": {
    "instagram": {
      "valid": true,
      "errors": [],
      "warnings": ["Resolution exceeds max..."]
    },
    "facebook": {
      "valid": true,
      "errors": [],
      "warnings": []
    }
  },
  "file": {
    "id": "123",
    "name": "test_highres_4000x3000.jpg",
    "type": "image/jpeg",
    "size": 856234,
    "url": "http://localhost:3000/uploads/..."
  }
}
```

---

## 📊 Database Verification

### Check uploaded images

```sql
SELECT 
  id,
  file_name,
  file_size,
  media_type,
  metadata->'optimized' as optimized,
  metadata->'image_info'->>'width' as width,
  metadata->'image_info'->>'height' as height,
  metadata->'image_info'->>'aspectRatio' as aspect_ratio,
  metadata->'image_validation'->'instagram'->>'valid' as instagram_valid,
  created_at
FROM autopostvn_media
WHERE media_type = 'image'
ORDER BY created_at DESC
LIMIT 10;
```

### Expected columns:

| id | file_name | file_size | optimized | width | height | aspect_ratio | instagram_valid |
|----|-----------|-----------|-----------|-------|--------|--------------|-----------------|
| 1 | test_perfect.jpg | 850000 | false | 1080 | 1080 | 1.00 | true |
| 2 | test_highres.jpg | 856234 | true | 1080 | 810 | 1.33 | true |
| 3 | test_large.jpg | 1200000 | true | 1080 | 1080 | 1.00 | true |

---

## 🐛 Troubleshooting Tests

### Test 1: FFmpeg Not Installed

**Expected behavior:**
```
⚠️ [IMAGE VALIDATE] FFmpeg not installed, skipping image validation
💡 [IMAGE VALIDATE] Install FFmpeg to enable automatic image optimization
```

**Result:** Image uploads successfully **without** validation or optimization.

---

### Test 2: Image Analysis Fails

**Simulate:** Upload corrupted image

**Create corrupted image:**
```bash
echo "not an image" > test_corrupt.jpg
```

**Expected result:**
```json
{
  "success": false,
  "error": "Failed to get image info: Unable to read image information"
}
```

---

### Test 3: Optimization Timeout

**Simulate:** Upload extremely large image (50MB+)

**Expected behavior:**
- Optimization times out after 60 seconds
- Falls back to original image
- Warning logged

---

## 📈 Performance Benchmarks

### Test Different Resolutions

```bash
# Small (500KB)
ffmpeg -f lavfi -i color=c=blue:s=800x600:d=1 -frames:v 1 -q:v 5 test_small.jpg

# Medium (2MB)
ffmpeg -f lavfi -i testsrc=s=1920x1080:d=1 -frames:v 1 -q:v 3 test_medium.jpg

# Large (8MB)
ffmpeg -f lavfi -i testsrc=s=4000x3000:d=1 -frames:v 1 -q:v 2 test_large.jpg

# Extra Large (20MB)
ffmpeg -f lavfi -i testsrc=s=6000x4000:d=1 -frames:v 1 -q:v 1 test_xlarge.jpg
```

### Expected Performance

| Size | Resolution | Validation Time | Optimization Time | Total Time |
|------|-----------|----------------|-------------------|------------|
| 500KB | 800x600 | ~0.1s | N/A (skipped) | ~0.1s |
| 2MB | 1920x1080 | ~0.2s | ~0.5s | ~0.7s |
| 8MB | 4000x3000 | ~0.3s | ~2s | ~2.3s |
| 20MB | 6000x4000 | ~0.5s | ~5s | ~5.5s |

---

## ✅ Success Criteria

### Validation Tests

- [ ] Perfect image uploads without optimization
- [ ] High-res image is resized to 1080px width
- [ ] Large file is compressed to < 8MB
- [ ] GIF is converted to JPG for Instagram
- [ ] Invalid aspect ratio returns error
- [ ] Portrait 4:5 validates successfully

### Performance Tests

- [ ] Small images (< 1MB) process in < 1 second
- [ ] Large images (5-10MB) process in < 3 seconds
- [ ] No memory leaks after 100 uploads
- [ ] Temp files are cleaned up

### Error Handling Tests

- [ ] FFmpeg not installed: graceful fallback
- [ ] Corrupted image: returns error
- [ ] Network timeout: returns error
- [ ] Disk full: returns error

### Database Tests

- [ ] Metadata includes `optimized` flag
- [ ] `image_info` contains dimensions
- [ ] `image_validation` has Instagram/Facebook results
- [ ] No null values in required fields

---

## 🔍 Debug Commands

### Check uploaded file

```bash
# Verify file exists
ls -lh public/uploads/[USER_ID]/

# Check image info
ffprobe -v error -show_entries stream=width,height -show_entries format=size,format_name public/uploads/[USER_ID]/[FILENAME]
```

### Monitor logs in real-time

```bash
# Development
npm run dev | grep "IMAGE"

# Production
pm2 logs autopost-vn | grep "IMAGE"
```

### Test FFmpeg installation

```bash
# Windows PowerShell
ffmpeg -version
ffprobe -version

# Linux/Mac
which ffmpeg
which ffprobe
```

---

## 📝 Test Checklist

Before deploying to production:

- [ ] All 6 test scenarios pass
- [ ] UI displays validation warnings
- [ ] Database metadata is correct
- [ ] Performance meets benchmarks
- [ ] Error handling works as expected
- [ ] FFmpeg fallback works (no FFmpeg installed)
- [ ] Logs are clear and informative
- [ ] No memory leaks or resource issues
- [ ] Temp files are cleaned up
- [ ] Images are accessible via public URL

---

## 🚀 Next Steps

After successful testing:

1. **Deploy to staging:**
   ```bash
   git push origin main
   ssh user@staging.autopostvn.cloud
   cd autopost-vn
   git pull
   npm run build
   pm2 restart autopost-vn
   ```

2. **Verify FFmpeg on staging:**
   ```bash
   ssh user@staging.autopostvn.cloud
   ffmpeg -version
   ```

3. **Run smoke tests on staging** with real images

4. **Deploy to production** once staging passes all tests

5. **Monitor production logs** for first few hours:
   ```bash
   pm2 logs autopost-vn --lines 100 | grep -E "IMAGE|OPTIMIZE"
   ```

---

## 📞 Support

If tests fail, check:

1. **FFmpeg installation:** `ffmpeg -version`
2. **Temp directory permissions:** `/tmp` or `os.tmpdir()`
3. **Disk space:** `df -h`
4. **Node.js version:** `node -v` (requires v18+)
5. **Database connection:** Check PostgreSQL logs

Common issues:
- ❌ FFmpeg not in PATH → Add to system PATH
- ❌ Temp files not deleted → Check filesystem permissions
- ❌ Optimization slow → Reduce image quality or resolution
- ❌ Database errors → Check metadata JSONB column

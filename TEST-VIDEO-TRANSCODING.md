# Test Server-Side Video Transcoding

## Quick Test

### 1. Install FFmpeg (if not already)

**Windows:**
```powershell
winget install Gyan.FFmpeg
# OR
choco install ffmpeg
```

**Linux/VPS:**
```bash
sudo apt update && sudo apt install -y ffmpeg
```

### 2. Verify FFmpeg

```powershell
ffmpeg -version
```

Should output something like:
```
ffmpeg version 6.x.x
```

### 3. Create Test Video (Non-Compatible)

Create a test video that needs transcoding:
```powershell
# Create 10s test video (1920x1080, interlaced - not Instagram compatible)
ffmpeg -f lavfi -i testsrc=duration=10:size=1920x1080:rate=30 `
  -vf "interlace" `
  -c:v libx264 -pix_fmt yuv422p `
  test-video-bad.mp4
```

### 4. Create Test Video (Instagram-Compatible)

```powershell
# Create 10s test video (1080x1920, progressive - Instagram ready)
ffmpeg -f lavfi -i testsrc=duration=10:size=1080x1920:rate=30 `
  -c:v libx264 -preset slow -crf 22 `
  -c:a aac -b:a 128k `
  -pix_fmt yuv420p -movflags +faststart `
  test-video-good.mp4
```

### 5. Test Upload via UI

1. Start dev server:
```powershell
npm run dev
```

2. Go to: `http://localhost:3000/compose`

3. Upload `test-video-bad.mp4`

4. Check console logs for transcoding:
```
🎬 [VIDEO TRANSCODE] Checking if video needs transcoding...
📊 [VIDEO TRANSCODE] Analyzing video...
📹 [VIDEO TRANSCODE] Video info: { needsTranscoding: true }
🔄 [VIDEO TRANSCODE] Transcoding required...
✅ [VIDEO TRANSCODE] Transcoding complete
🎉 [VIDEO TRANSCODE] Video transcoded successfully
```

5. Upload `test-video-good.mp4`

6. Should see:
```
✅ [VIDEO TRANSCODE] Video already compatible, no transcoding needed
```

### 6. Test via API (cURL)

**Upload video needing transcoding:**
```powershell
$videoPath = "test-video-bad.mp4"
$token = "your-auth-token-here"

curl -X POST http://localhost:3000/api/media/upload `
  -H "Authorization: Bearer $token" `
  -F "file=@$videoPath"
```

Expected response:
```json
{
  "success": true,
  "transcoded": true,
  "file": {
    "id": "...",
    "name": "test-video-bad.mp4",
    "type": "video/mp4",
    "size": 5242880,
    "url": "http://localhost:3000/uploads/...",
    "mediaType": "video"
  }
}
```

**Upload Instagram-ready video:**
```powershell
$videoPath = "test-video-good.mp4"

curl -X POST http://localhost:3000/api/media/upload `
  -H "Authorization: Bearer $token" `
  -F "file=@$videoPath"
```

Expected response:
```json
{
  "success": true,
  "transcoded": false,
  "file": { ... }
}
```

### 7. Verify in Database

```sql
SELECT 
  file_name,
  file_size,
  metadata->>'transcoded' as transcoded,
  metadata->'video_info' as video_info,
  created_at
FROM autopostvn_media
WHERE media_type = 'video'
ORDER BY created_at DESC
LIMIT 5;
```

## Test Scenarios

### ✅ Scenario 1: Interlaced Video
**Input**: Interlaced scan type  
**Expected**: Transcode to progressive  
**Result**: `transcoded: true`

### ✅ Scenario 2: Wrong Pixel Format
**Input**: yuv422p or yuv444p  
**Expected**: Convert to yuv420p  
**Result**: `transcoded: true`

### ✅ Scenario 3: High Bitrate
**Input**: 10 Mbps video  
**Expected**: Reduce to 4-5 Mbps  
**Result**: `transcoded: true`

### ✅ Scenario 4: Large Resolution
**Input**: 4K (3840x2160)  
**Expected**: Downscale to 1080p  
**Result**: `transcoded: true`

### ✅ Scenario 5: Already Compatible
**Input**: H.264, yuv420p, progressive, 1080p  
**Expected**: Skip transcoding  
**Result**: `transcoded: false`

### ✅ Scenario 6: FFmpeg Not Installed
**Input**: Any video  
**Expected**: Upload original, warning in logs  
**Result**: `transcoded: false`, warning message

## Performance Benchmarks

Test with different video sizes:

| Video Size | Duration | Transcoding Time | Reduction |
|-----------|----------|------------------|-----------|
| 10 MB     | 10s      | ~5-10s          | 40%       |
| 50 MB     | 30s      | ~15-30s         | 50%       |
| 100 MB    | 60s      | ~30-60s         | 55%       |

## Troubleshooting Tests

### Test 1: FFmpeg Missing
```powershell
# Temporarily rename FFmpeg
mv C:\ffmpeg\bin\ffmpeg.exe C:\ffmpeg\bin\ffmpeg.exe.bak

# Upload video
# Should see warning and upload original

# Restore
mv C:\ffmpeg\bin\ffmpeg.exe.bak C:\ffmpeg\bin\ffmpeg.exe
```

### Test 2: Timeout
```powershell
# Create very long video (2 minutes)
ffmpeg -f lavfi -i testsrc=duration=120:size=1920x1080:rate=30 test-long.mp4

# Upload - should timeout or complete within maxDuration
```

### Test 3: Corrupted Video
```powershell
# Create corrupted file
echo "not a video" > test-corrupt.mp4

# Upload - should fail gracefully with error message
```

## Cleanup

```powershell
# Remove test videos
rm test-video-*.mp4
rm test-long.mp4
rm test-corrupt.mp4
```

## Integration with Instagram

After transcoding, verify Instagram accepts the video:

1. Upload transcoded video via UI
2. Schedule post to Instagram
3. Check publish result
4. Should succeed without "progressive_video_not_ready" error

## Expected Logs

### Successful Transcoding
```
📤 [MEDIA UPLOAD] Request received
👤 [MEDIA UPLOAD] User ID: abc-123
📁 [MEDIA UPLOAD] File received: { name: 'video.mp4', type: 'video/mp4', size: 50MB }
🎬 [VIDEO TRANSCODE] Checking if video needs transcoding...
📊 [VIDEO TRANSCODE] Analyzing video at: /tmp/upload_xyz.mp4
📹 [VIDEO TRANSCODE] Video info: { width: 1920, height: 1080, codec: 'h264', needsTranscoding: true }
✅ [VIDEO TRANSCODE] Validation result: { valid: false, errors: [], warnings: ['Pixel format yuv422p'] }
🔄 [VIDEO TRANSCODE] Transcoding required...
✅ [VIDEO TRANSCODE] Transcoding complete: /tmp/transcoded_abc.mp4
🎉 [VIDEO TRANSCODE] Video transcoded successfully, new size: 20MB
💾 [MEDIA UPLOAD] Saving to database...
✅ [MEDIA UPLOAD] Database record created
🎉 [MEDIA UPLOAD] Upload completed successfully: { transcoded: true }
```

### Skip Transcoding
```
📤 [MEDIA UPLOAD] Request received
📁 [MEDIA UPLOAD] File received: { name: 'video-ready.mp4' }
🎬 [VIDEO TRANSCODE] Checking if video needs transcoding...
📊 [VIDEO TRANSCODE] Analyzing video
📹 [VIDEO TRANSCODE] Video info: { needsTranscoding: false }
✅ [VIDEO TRANSCODE] Video already compatible, no transcoding needed
💾 [MEDIA UPLOAD] Saving to database...
🎉 [MEDIA UPLOAD] Upload completed successfully: { transcoded: false }
```

## Success Criteria

- ✅ FFmpeg detected and working
- ✅ Non-compatible videos automatically transcoded
- ✅ Compatible videos uploaded without transcoding
- ✅ Transcoding completes within reasonable time
- ✅ File size reduced significantly
- ✅ Instagram accepts transcoded videos
- ✅ Metadata saved correctly in database
- ✅ Errors handled gracefully
- ✅ No server crashes or memory leaks

## Next Steps

If all tests pass:
1. Deploy FFmpeg to production VPS
2. Monitor CPU usage under load
3. Set up temp file cleanup
4. Consider queue system for high traffic
5. Update user documentation

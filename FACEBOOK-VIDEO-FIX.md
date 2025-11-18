# Facebook Video Posting Fix

## Problem
Facebook videos were being uploaded as photos because `mediaType` was `'none'` instead of `'video'`.

## Root Cause
1. Database `media_type` column defaults to `'none'`
2. Scheduler passed this value directly to publishers
3. FacebookPublisher checks `if (data.mediaType === 'video')` to use `/videos` endpoint
4. When `mediaType='none'`, it fell back to `/photos` endpoint

## Solution
Added auto-detection logic in `src/lib/scheduler-optimized.ts` (lines 460-485):

```typescript
// Auto-detect media type from URL if database has 'none'
let mediaType = post.media_type || 'none';

if ((mediaType === 'none' || !mediaType) && post.media_urls && post.media_urls.length > 0) {
  const firstUrl = post.media_urls[0].toLowerCase();
  
  // Check file extension
  if (firstUrl.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv)$/)) {
    mediaType = 'video';
    console.log('🎥 Auto-detected media type: video from URL:', firstUrl);
  } else if (firstUrl.match(/\.(jpg|jpeg|png|gif|webp|heif|tiff)$/)) {
    mediaType = 'image';
    console.log('📷 Auto-detected media type: image from URL:', firstUrl);
  } else if (post.media_urls.length > 1) {
    mediaType = 'album';
    console.log('📚 Auto-detected media type: album (multiple media)');
  }
}
```

## File Extensions Supported
- **Videos**: `.mp4`, `.mov`, `.avi`, `.wmv`, `.flv`, `.webm`, `.mkv`
- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.heif`, `.tiff`
- **Albums**: Multiple media URLs → `album`

## Testing Checklist

### 1. Test Facebook Video
- [ ] Schedule video post to Facebook
- [ ] Check logs for `🎥 Auto-detected media type: video`
- [ ] Verify upload uses `/videos` endpoint
- [ ] Confirm successful external post ID returned
- [ ] Check Facebook page to see video posted

### 2. Test Instagram Still Works
- [ ] Schedule video to Instagram
- [ ] Verify REELS media_type used
- [ ] Confirm no regression from scheduler changes
- [ ] Check successful post with external ID

### 3. Monitor Logs
```bash
# SSH to VPS
ssh root@autopostvn.cloud

# Watch PM2 logs
pm2 logs autopost-vn --lines 50

# Look for auto-detection messages
grep "Auto-detected" ~/.pm2/logs/autopost-vn-out.log | tail -20
```

## Deployment Steps

### Option 1: Automated (Using deploy script)
```bash
# Make script executable
chmod +x deploy-facebook-fix.sh

# Run deployment
./deploy-facebook-fix.sh
```

### Option 2: Manual
```bash
# Upload file
scp src/lib/scheduler-optimized.ts root@autopostvn.cloud:/var/www/autopost-vn/src/lib/

# SSH to VPS
ssh root@autopostvn.cloud

# Build and restart
cd /var/www/autopost-vn
npm run build
pm2 restart autopost-vn

# Check status
pm2 status
pm2 logs autopost-vn --lines 20
```

## Expected Log Output

### Before Fix
```
📝 Publishing to Facebook...
mediaType: "none"
⚠️ Using /photos endpoint (fallback)
❌ Không thể tải ảnh lên: Invalid video format
```

### After Fix
```
🎥 Auto-detected media type: video from URL: https://autopostvn.cloud/uploads/123/video.mp4
📝 Publishing to Facebook...
mediaType: "video"
✅ Using /videos endpoint
✅ Video uploaded successfully
External ID: 1234567890_9876543210
```

## Related Files
- `src/lib/scheduler-optimized.ts` - Scheduler with auto-detection
- `src/lib/social-publishers.ts` - FacebookPublisher class
- `/etc/nginx/sites-available/autopost` - NGINX config for /uploads/
- `INSTAGRAM-URL-FIX.md` - Related Instagram URL accessibility fix

## Database Cleanup (Optional)
To fix existing records with `media_type='none'`:

```sql
-- Update videos
UPDATE autopostvn_scheduled_posts 
SET media_type = 'video' 
WHERE media_type = 'none' 
  AND media_urls::text ~ '\.(mp4|mov|avi|wmv|flv|webm|mkv)';

-- Update images
UPDATE autopostvn_scheduled_posts 
SET media_type = 'image' 
WHERE media_type = 'none' 
  AND media_urls::text ~ '\.(jpg|jpeg|png|gif|webp|heif|tiff)';

-- Update albums (multiple media)
UPDATE autopostvn_scheduled_posts 
SET media_type = 'album' 
WHERE media_type = 'none' 
  AND jsonb_array_length(media_urls) > 1;
```

## Success Criteria
- [x] Auto-detection implemented
- [x] Build successful locally
- [ ] Deployed to VPS
- [ ] Facebook video posts working
- [ ] Instagram still working
- [ ] No regressions in other platforms

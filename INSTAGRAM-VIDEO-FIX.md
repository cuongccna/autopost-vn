# Instagram Video Transcoding Error Fix

## Vấn đề

Khi upload video lên Instagram, gặp lỗi:
```
Video Transcoding Error: Video transcode failed, video status: progressive_video_not_ready
Error code: -1, Subcode: 2207082
```

## Nguyên nhân

Instagram **rất khắt khe** về video format và yêu cầu:

1. ✅ **Video Codec**: H.264 (x264) - Main hoặc High profile
2. ✅ **Audio Codec**: AAC-LC
3. ✅ **Container**: MP4 với **faststart flag** (moov atom ở đầu file)
4. ✅ **Scan Type**: Progressive (KHÔNG được interlaced)
5. ✅ **Pixel Format**: YUV 4:2:0 (yuv420p)
6. ✅ **Max Resolution**: 1920x1080 (1080p)
7. ✅ **Max Bitrate**: 5 Mbps (khuyến nghị 3-4 Mbps)
8. ✅ **Max File Size**: 100 MB
9. ✅ **Aspect Ratio**: 9:16 (vertical), 1:1 (square), 4:5 (portrait)
10. ✅ **Duration**: 3 giây - 90 giây (Reels)

## Giải pháp: Re-encode Video với FFmpeg

### Cài đặt FFmpeg

**Windows:**
```powershell
# Tải từ https://ffmpeg.org/download.html
# Hoặc dùng Chocolatey:
choco install ffmpeg

# Hoặc dùng winget:
winget install Gyan.FFmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt update
sudo apt install ffmpeg
```

### Command Re-encode Chuẩn Instagram

#### 1. Video Reels (9:16 - Vertical)
```bash
ffmpeg -i input.mp4 \
  -c:v libx264 -preset slow -crf 22 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  -pix_fmt yuv420p \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
  -r 30 \
  -b:v 4M -maxrate 5M -bufsize 10M \
  output_reels.mp4
```

#### 2. Video Square (1:1)
```bash
ffmpeg -i input.mp4 \
  -c:v libx264 -preset slow -crf 22 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  -pix_fmt yuv420p \
  -vf "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2" \
  -r 30 \
  -b:v 3M -maxrate 4M -bufsize 8M \
  output_square.mp4
```

#### 3. Video Portrait (4:5)
```bash
ffmpeg -i input.mp4 \
  -c:v libx264 -preset slow -crf 22 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  -pix_fmt yuv420p \
  -vf "scale=1080:1350:force_original_aspect_ratio=decrease,pad=1080:1350:(ow-iw)/2:(oh-ih)/2" \
  -r 30 \
  -b:v 3.5M -maxrate 4.5M -bufsize 9M \
  output_portrait.mp4
```

#### 4. Auto-detect & Fix (Universal)
```bash
ffmpeg -i input.mp4 \
  -c:v libx264 -preset slow -crf 22 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  -pix_fmt yuv420p \
  -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2" \
  -r 30 \
  -b:v 4M -maxrate 5M -bufsize 10M \
  output_fixed.mp4
```

### Giải thích Parameters

| Parameter | Ý nghĩa |
|-----------|---------|
| `-c:v libx264` | Video codec H.264 |
| `-preset slow` | Chất lượng encode cao (chậm hơn) |
| `-crf 22` | Constant Rate Factor 22 (18-28 tốt, 22 cân bằng) |
| `-c:a aac` | Audio codec AAC |
| `-b:a 128k` | Audio bitrate 128 kbps |
| `-movflags +faststart` | **Quan trọng**: Moov atom ở đầu file |
| `-pix_fmt yuv420p` | **Quan trọng**: Pixel format 4:2:0 |
| `-vf scale=...` | Resize video (giữ aspect ratio) |
| `-r 30` | Framerate 30fps |
| `-b:v 4M` | Video bitrate 4 Mbps |
| `-maxrate 5M` | Max bitrate 5 Mbps |
| `-bufsize 10M` | Buffer size |

### Kiểm tra Video sau khi Encode

```bash
# Kiểm tra thông tin video
ffprobe -v error -show_entries format=duration,size,bit_rate \
  -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt \
  -of default=noprint_wrappers=1 output_fixed.mp4

# Output mẫu:
# codec_name=h264
# width=1080
# height=1920
# r_frame_rate=30/1
# pix_fmt=yuv420p
# duration=15.000000
# size=7500000
# bit_rate=4000000
```

## Alternative: Sử dụng Online Tools

Nếu không muốn cài FFmpeg:

1. **CloudConvert**: https://cloudconvert.com/mp4-converter
   - Chọn Preset: **Instagram Video**
   
2. **HandBrake** (GUI): https://handbrake.fr/
   - Preset: **Fast 1080p30**
   - Video Codec: H.264
   - Quality: RF 22
   - Audio: AAC 128k
   - Web Optimized: ✅ (tương đương faststart)

3. **Adobe Media Encoder**:
   - Format: H.264
   - Preset: YouTube 1080p HD
   - Advanced: Check "Fast Start"

## Implement Automatic Transcoding (Future)

Để tự động hóa, có thể:

1. **Server-side transcoding** với FFmpeg binary
2. **Cloud transcoding service**: AWS MediaConvert, Cloudinary
3. **Client-side warning**: Detect video không hợp lệ trước khi upload

### Example Node.js Server-side Transcoding

```javascript
const ffmpeg = require('fluent-ffmpeg');

async function transcodeForInstagram(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate('128k')
      .outputOptions([
        '-preset slow',
        '-crf 22',
        '-movflags +faststart',
        '-pix_fmt yuv420p',
        '-vf scale=\'min(1920,iw)\':\'min(1080,ih)\':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2',
        '-r 30',
        '-b:v 4M',
        '-maxrate 5M',
        '-bufsize 10M'
      ])
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}
```

## Troubleshooting

### Lỗi "Invalid parameters"
- ✅ Check: Video có phải progressive không (không interlaced)
- ✅ Check: Pixel format là yuv420p
- ✅ Check: File có faststart flag

### Lỗi "Video too long"
```bash
# Cắt video xuống 60 giây
ffmpeg -i input.mp4 -t 60 -c copy output_trimmed.mp4
```

### Lỗi "File size too large"
```bash
# Giảm bitrate
ffmpeg -i input.mp4 -b:v 2M -maxrate 3M output_smaller.mp4
```

### Video bị mất chất lượng
```bash
# Tăng chất lượng (giảm CRF)
ffmpeg -i input.mp4 -crf 18 ... output_hq.mp4
```

## References

- Instagram API Video Specifications: https://developers.facebook.com/docs/instagram-api/reference/ig-user/media
- FFmpeg H.264 Encoding Guide: https://trac.ffmpeg.org/wiki/Encode/H.264
- Instagram Reels Technical Requirements: https://help.instagram.com/1038071743007909

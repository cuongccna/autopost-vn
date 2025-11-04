# 🚀 Media Library - Quick Setup Guide

## ⚡ Setup trong 5 phút

### **Step 1: Run Database Migration**
```bash
# Connect to Supabase database
psql -h db.xxx.supabase.co -U postgres -d postgres

# Run migration
\i migrations/add-media-lifecycle.sql

# Or via Supabase Dashboard → SQL Editor
# Copy & paste nội dung file add-media-lifecycle.sql
```

### **Step 2: Create Storage Bucket**
```sql
-- In Supabase Dashboard → Storage → New Bucket
Bucket name: media
Public: YES
File size limit: 100MB (104857600 bytes)
Allowed MIME types: image/*, video/*
```

### **Step 3: Add Environment Variable**
```env
# Add to .env.local
CRON_SECRET=your-random-secret-key-here
```

Generate secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **Step 4: Deploy & Test**
```bash
npm run build
npm run dev

# Navigate to:
http://localhost:3000/media
```

---

## 🎯 Test Checklist

### **Upload Test:**
- [ ] Visit `/media`
- [ ] Click "Upload Media"
- [ ] Drag & drop image
- [ ] Verify upload progress
- [ ] Check success status
- [ ] See media in grid

### **Preview Test:**
- [ ] Click on uploaded image
- [ ] Modal opens with preview
- [ ] Click "Download" → file downloads
- [ ] Click "Copy URL" → URL copied
- [ ] Add tag "product"
- [ ] Tag appears in modal & grid

### **Delete Test:**
- [ ] Click trash icon on media card
- [ ] Confirm delete
- [ ] Media disappears from grid

### **Filter Test:**
- [ ] Upload 1 image + 1 video
- [ ] Filter by "Images" → only image shows
- [ ] Filter by "Videos" → only video shows
- [ ] Search by filename → finds media

---

## 🔧 Troubleshooting

### **Error: "Failed to upload"**
**Cause**: Storage bucket not created or RLS policy missing

**Fix**:
```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true);

-- Add RLS policy
CREATE POLICY "Users can upload own media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### **Error: "Cannot find module"**
**Cause**: TypeScript import paths

**Fix**:
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### **Error: "Unauthorized" when uploading**
**Cause**: User not logged in

**Fix**:
```typescript
// Ensure user is authenticated
const session = await getServerSession(authOptions);
if (!session?.user) {
  // Redirect to login
}
```

---

## 📊 Verify Setup

### **Check Database:**
```sql
-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'autopostvn_media'
AND column_name IN ('status', 'media_type', 'platform_urls');

-- Should return 3 rows
```

### **Check Storage:**
```bash
# In Supabase Dashboard → Storage
# Should see bucket: "media"
# Try manual upload via dashboard
```

### **Check API:**
```bash
# Test media API
curl http://localhost:3000/api/media

# Test stats API
curl http://localhost:3000/api/media/stats
```

---

## 🎨 UI Screenshots

### **Media Library Page**
- Grid view with thumbnails
- Stats dashboard (total, images, videos, storage)
- Search & filters
- Upload button

### **Upload Modal**
- Drag & drop zone
- Multiple file support
- Progress bars
- Success/Error indicators

### **Preview Modal**
- Image/Video preview
- Download, Copy URL buttons
- Tag management
- Platform URLs list
- Engagement score

---

## ⏰ Setup Cron Job (Production)

### **Vercel:**
```json
{
  "crons": [{
    "path": "/api/cron/media-cleanup",
    "schedule": "0 2 * * *"
  }]
}
```

### **Manual Test:**
```bash
# Test cron locally
curl -X GET http://localhost:3000/api/cron/media-cleanup \
  -H "Authorization: Bearer your-cron-secret"

# Expected response:
{
  "success": true,
  "results": {
    "free": { "archivedCount": 0, "deletedCount": 0 },
    "professional": { "archivedCount": 0, "deletedCount": 0 },
    "enterprise": { "archivedCount": 0, "deletedCount": 0 }
  }
}
```

---

## 📈 Next Steps

1. **Upload first media** → Test basic flow
2. **Tag some media** → Test tag functionality
3. **Wait 30+ days** → Test auto-archive (or manually update `published_at`)
4. **Check engagement** → Integrate with platform APIs
5. **Monitor storage** → Set up alerts for quota limits

---

## 🎉 You're Done!

Navigate to `/media` and enjoy your new Media Library! 🚀

**Need help?** Check `MEDIA-LIBRARY-SYSTEM.md` for full documentation.

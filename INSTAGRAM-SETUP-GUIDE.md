# Instagram API Setup Guide

## ✅ Completed Implementation

Instagram API integration has been successfully implemented with the following components:

### 1. **Environment Configuration** ✅
Added to `.env.local`:
```bash
INSTAGRAM_APP_ID=1771629063519781
INSTAGRAM_APP_SECRET=bd6c997f236fd4638046282e8f47a091
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=autopostvn_instagram_webhook_secret_2025
```

### 2. **OAuth Flow** ✅
- **Endpoint**: `/api/auth/oauth/instagram/callback`
- **Features**:
  - Exchanges authorization code for access token
  - Fetches Instagram Business Accounts through Facebook Pages
  - Saves multiple Instagram accounts to database
  - Handles errors gracefully with redirect parameters

### 3. **Webhook Endpoint** ✅
- **Endpoint**: `/api/webhooks/instagram`
- **Features**:
  - GET: Webhook verification for Instagram
  - POST: Receives real-time events (comments, mentions, live comments)
  - Logs events to activity logs
  - Always returns 200 to prevent retries

### 4. **Instagram Publisher** ✅
- **Class**: `InstagramPublisher` in `social-publishers.ts`
- **Capabilities**:
  - Posts images to Instagram
  - Posts videos to Instagram
  - Posts carousels (multiple images)
  - Two-step process: Create container → Publish container
  - Rate limiting support
  - Error handling and logging

### 5. **Database Support** ✅
- Provider constraint includes `instagram`
- Existing Instagram accounts in database: 2
- All tables support Instagram provider

---

## 🔧 Facebook Developer Console Setup

### Step 1: Configure Instagram Product

1. Go to https://developers.facebook.com/apps/1402460547980710
2. Click **"Instagram"** in left sidebar
3. Complete these sections:

#### A. **Tạo mã truy cập** (Create Access Token)
- Click **"Thêm tài khoản"** (Add Account)
- Select Instagram Business Account
- Authorize the app
- ✅ Access token will be saved automatically via OAuth flow

#### B. **Đặt cấu hình webhook** (Configure Webhook)

**URL gọi lại (Callback URL):**
```
Production: https://yourdomain.com/api/webhooks/instagram
Development: https://your-ngrok-url.ngrok.io/api/webhooks/instagram
```

**Xác minh mã (Verify Token):**
```
autopostvn_instagram_webhook_secret_2025
```

**Important Notes:**
- ⚠️ Instagram webhooks require **HTTPS**
- ⚠️ For local development, use **ngrok** or **localtunnel**
- ✅ Webhook is **optional** for posting - only needed for receiving events

#### C. **Thiết lập tính năng đăng nhập** (Setup Login Features)

Select these permissions:
- ✅ `instagram_basic` - Basic profile info
- ✅ `instagram_content_publish` - Publish posts
- ✅ `pages_read_engagement` - Read page data
- ✅ `pages_show_list` - List pages

---

## 🚀 Testing Instagram Integration

### Test 1: Connect Instagram Account

1. Start dev server:
```bash
npm run dev
```

2. Login to app: http://localhost:3000

3. Go to **Social Accounts** page

4. Click **"Connect Instagram"**

5. Authorize your Instagram Business Account

6. ✅ Account should appear in your connected accounts list

### Test 2: Post to Instagram

1. Go to **Compose** page

2. Select **Instagram** as provider

3. Upload an image (JPG/PNG, max 8MB)

4. Add caption (max 2,200 characters)

5. Click **"Post Now"** or **"Schedule"**

6. ✅ Check Instagram app to verify post

### Test 3: Webhook (Optional)

**For Local Development:**

1. Install ngrok:
```bash
npm install -g ngrok
```

2. Start ngrok tunnel:
```bash
ngrok http 3000
```

3. Copy HTTPS URL (e.g., `https://abc123.ngrok.io`)

4. Update webhook URL in Facebook Console:
```
https://abc123.ngrok.io/api/webhooks/instagram
```

5. Test webhook verification:
```bash
curl "https://abc123.ngrok.io/api/webhooks/instagram?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=autopostvn_instagram_webhook_secret_2025"
```

Expected response: `test123`

---

## 📊 Instagram API Limitations

### Publishing Limits
- **25 posts per day** per Instagram account
- **1 post every 20 seconds** (rate limit)
- Container must be **ready** before publishing (can take 10-30 seconds)

### Content Requirements

**Images:**
- Format: JPG, PNG
- Aspect ratio: 4:5 to 1.91:1
- Min size: 320px
- Max size: 8MB

**Videos:**
- Format: MP4, MOV
- Duration: 3-60 seconds (Feed), up to 15 minutes (IGTV)
- Aspect ratio: 4:5 to 1.91:1
- Max size: 100MB
- Frame rate: 23-60 FPS

**Carousels:**
- 2-10 images/videos
- All items must have same aspect ratio
- First item cannot be a video

### API Rate Limits
- **200 calls per hour** per user
- **4800 calls per day** per app
- Applies across all Facebook/Instagram Graph API calls

---

## 🔍 Troubleshooting

### Error: "No Instagram Business Account"

**Solution:**
1. Make sure your Instagram is a **Business** or **Creator** account
2. Link Instagram to a Facebook Page you manage
3. Verify in Instagram Settings → Account → Linked accounts

### Error: "Token Exchange Failed"

**Solution:**
1. Check `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET` in `.env.local`
2. Verify redirect URI matches in Facebook Console: 
   ```
   http://localhost:3000/api/auth/oauth/instagram/callback
   ```
3. Make sure app is in **Development Mode** or your account is added as Test User

### Error: "Container Not Ready"

**Solution:**
1. Instagram needs time to process media (10-30 seconds)
2. Our publisher automatically polls until ready (max 60 seconds)
3. If timeout, try again with smaller file

### Error: "Invalid Media URL"

**Solution:**
1. Media URL must be publicly accessible via HTTPS
2. For local dev, upload to cloud storage first (S3, Cloudinary, etc.)
3. Check file format and size meet Instagram requirements

---

## 📝 Next Steps

### Production Deployment

1. **Get Production Domain:**
   - Deploy app to production server
   - Get HTTPS domain (e.g., https://autopostvn.com)

2. **Update Webhook URL:**
   - Change from ngrok to production URL
   - Format: `https://autopostvn.com/api/webhooks/instagram`

3. **Submit for App Review:**
   - Go to Facebook App Dashboard → App Review
   - Request advanced permissions:
     - `instagram_content_publish`
     - `pages_read_engagement`
   - Provide screencast demonstrating feature
   - Explain use case clearly

4. **Switch to Live Mode:**
   - Once approved, switch app from Development to Live mode
   - All users can now connect Instagram

### Optional Enhancements

1. **Instagram Stories:**
   - Implement Stories API endpoint
   - Support 9:16 aspect ratio
   - Add interactive stickers

2. **Instagram Reels:**
   - Add Reels container type
   - Support vertical video (9:16)
   - Optimize for short-form content

3. **Analytics:**
   - Fetch post insights (likes, comments, reach)
   - Display analytics in dashboard
   - Track engagement over time

4. **Auto-Reply:**
   - Process comment webhook events
   - Implement auto-reply logic
   - Support keyword-based responses

---

## ✅ Summary

**What's Working:**
- ✅ Instagram OAuth connection
- ✅ Access token exchange and storage
- ✅ Instagram Business Account discovery
- ✅ Publishing images, videos, carousels
- ✅ Two-step container publishing
- ✅ Webhook endpoint (verification + events)
- ✅ Database support for Instagram provider
- ✅ Rate limiting
- ✅ Error handling and logging

**What's Required Before Going Live:**
- ⚠️ Production domain with HTTPS
- ⚠️ Facebook App Review approval
- ⚠️ Update webhook URL to production
- ⚠️ Add privacy policy and terms of service

**Current Status:**
🟢 **Ready for Development & Testing**
🟡 **Pending Production Deployment**

For questions or issues, check:
- Instagram Graph API Docs: https://developers.facebook.com/docs/instagram-api
- Webhook Guide: https://developers.facebook.com/docs/instagram-api/guides/webhooks

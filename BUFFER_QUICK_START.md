# Buffer Integration - Quick Start 🟣

## ✅ Đã hoàn thành

### 1. Service Layer
- ✅ `src/lib/services/BufferService.ts` - Buffer API service
  - OAuth authentication
  - Profile management  
  - Post scheduling
  - Queue management
  - Helper methods

### 2. API Routes
- ✅ `src/app/api/oauth/buffer/route.ts` - OAuth initiation
- ✅ `src/app/api/oauth/buffer/callback/route.ts` - OAuth callback handler

### 3. Configuration
- ✅ Updated `src/app/api/oauth/[provider]/route.ts` - Added Buffer config
- ✅ Updated `src/lib/constants.ts` - Added Buffer provider
- ✅ Updated `.env.local` - Added Buffer credentials

### 4. UI Components
- ✅ Updated `src/components/features/AddAccountModal.tsx` - Buffer connection UI
- ✅ Updated `src/components/features/AccountsManagement.tsx` - Buffer permissions display

### 5. Documentation
- ✅ `BUFFER_INTEGRATION_GUIDE.md` - Complete integration guide

## 🚀 Để sử dụng Buffer:

### Bước 1: Lấy Buffer Credentials

1. Truy cập: https://buffer.com/developers
2. Tạo app mới
3. Copy **Client ID** và **Client Secret**
4. Thêm Redirect URI: `http://localhost:3000/api/oauth/buffer/callback`

### Bước 2: Cập nhật .env.local

```bash
BUFFER_CLIENT_ID=your_actual_client_id
BUFFER_CLIENT_SECRET=your_actual_client_secret
BUFFER_API_URL=https://api.bufferapp.com/1
```

### Bước 3: Kết nối Buffer trong App

1. Vào trang **Tài khoản mạng xã hội**
2. Click **"Thêm tài khoản"**
3. Chọn **Buffer** (icon màu tím 🟣)
4. Đăng nhập Buffer và authorize
5. ✅ Tất cả social accounts trong Buffer sẽ được đồng bộ!

## 🎯 Tính năng Buffer

### Qua Buffer API, bạn có thể:

- ✅ **Quản lý đa nền tảng**: Facebook, Twitter, LinkedIn, Instagram qua 1 API
- ✅ **Lên lịch posts**: Schedule với Buffer's smart timing
- ✅ **Queue management**: Thêm vào queue, move to top, reorder
- ✅ **Analytics**: Xem performance của posts
- ✅ **Team collaboration**: Nhiều users cùng quản lý (Buffer Team plan)

### So sánh với Direct Integration:

| Tính năng | Direct (FB/IG) | Via Buffer |
|-----------|---------------|------------|
| Setup | Phức tạp (App Review) | Đơn giản (OAuth) |
| Permissions | Nhiều permissions riêng | 1 Buffer token |
| Multi-platform | Từng API riêng | Unified API |
| Scheduling | Tự build | Buffer's smart queue |
| Analytics | Basic | Advanced |
| Cost | Free (sau App Review) | Buffer subscription |

## 🔧 API Usage Examples

### Schedule Post

```typescript
import { bufferService } from '@/lib/services/BufferService';

const result = await bufferService.schedulePost({
  profileIds: ['5f3a8b2c1e4d3a2b1c', '5f3a8b2c1e4d3a2b2d'],
  content: 'Check out our new product! 🚀 #NewLaunch',
  media: ['https://example.com/product.jpg'],
  scheduledAt: new Date('2025-10-20T14:00:00'),
});

if (result.success) {
  console.log('Scheduled for:', result.data?.updates.length, 'profiles');
}
```

### Get Connected Accounts

```typescript
const accounts = await bufferService.getConnectedAccounts();

accounts.accounts?.forEach(account => {
  console.log(`${account.platform}: @${account.username}`);
});
```

### Post Now

```typescript
await bufferService.schedulePost({
  profileIds: ['profile_id'],
  content: 'Breaking news! 📰',
  postNow: true, // Post immediately
});
```

## 📊 Database Structure

Buffer accounts trong `user_social_accounts`:

```sql
provider: 'buffer'
platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram'
account_id: 'buffer_profile_id'
account_name: 'Display Name'
access_token: 'encrypted_token'
metadata: {
  buffer_profile_id: '...',
  formatted_service: 'Facebook Page',
  timezone: 'America/New_York'
}
```

## ⚠️ Important Notes

### Buffer Limits
- Free: 3 channels, 10 scheduled posts/channel
- Essentials: Unlimited posts ($6/channel/month)
- Team: Advanced features ($12/channel/month)

### OAuth vs API Token
- **OAuth (Recommended)**: Mỗi user connect riêng Buffer account của họ
- **API Token**: Dùng 1 Buffer account chung cho tất cả users (không khuyến nghị)

### Supported Platforms
Buffer supports:
- ✅ Facebook Pages
- ✅ Twitter
- ✅ LinkedIn (Personal & Company)
- ✅ Instagram Business
- ⚠️ Instagram Personal (limited)

## 🧪 Testing

### Test Connection

```bash
# In browser console
fetch('/api/oauth/buffer?action=connect')
  .then(r => r.json())
  .then(console.log)
```

### Test Service

```javascript
// Create test file: test-buffer.js
import { bufferService } from './src/lib/services/BufferService';

async function test() {
  const valid = await bufferService.validateConnection();
  console.log('Valid:', valid);
  
  const profiles = await bufferService.getProfiles();
  console.log('Profiles:', profiles.data);
}

test();
```

## 🎨 UI Updates

### Provider Icon Colors
- Facebook: Blue 🔵
- Instagram: Pink 🩷
- Zalo: Sky Blue 🔷
- **Buffer: Purple 🟣**

### New Buttons
- "Kết nối Buffer" in AddAccountModal
- Buffer badge showing "via Buffer" for synced accounts
- Purple chip for Buffer accounts in lists

## 📝 Next Steps

1. **Setup Buffer Developer App** (1 phút)
2. **Add credentials to .env** (30 giây)
3. **Test OAuth flow** (2 phút)
4. **Schedule first post** (1 phút)

## 🆘 Troubleshooting

### "Buffer access token not configured"
→ Thêm `BUFFER_ACCESS_TOKEN` vào `.env.local` (optional, chỉ cho testing)

### "Invalid redirect URI"
→ Kiểm tra Buffer app settings, đảm bảo redirect URI match exactly

### "Profile not found"
→ User chưa connect social accounts trong Buffer. Hướng dẫn họ:
   1. Login Buffer.com
   2. Connect social accounts
   3. Quay lại AutoPost VN và reconnect

---

**Status:** ✅ Ready to use  
**Updated:** 2025-10-15

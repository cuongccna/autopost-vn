# Buffer Integration Guide 🚀

## Tổng quan

Buffer là một công cụ quản lý social media cho phép lên lịch và đăng bài tự động lên nhiều nền tảng. Tích hợp Buffer vào AutoPost VN giúp bạn:

- ✅ Quản lý nhiều social accounts (Facebook, Twitter, LinkedIn, Instagram) qua 1 API
- ✅ Lên lịch posts với Buffer's smart scheduling
- ✅ Theo dõi analytics và performance
- ✅ Tận dụng Buffer's posting queue system

## 🔧 Setup Buffer App

### Bước 1: Tạo Buffer Developer App

1. Truy cập [Buffer Developers](https://buffer.com/developers)
2. Click **"Create App"**
3. Điền thông tin:
   ```
   App Name: AutoPost VN
   Description: Social media auto-posting application
   Website: http://localhost:3000 (development)
   ```

### Bước 2: Lấy API Credentials

1. Sau khi tạo app, vào **App Details**
2. Copy các thông tin:
   - **Client ID**
   - **Client Secret**
3. Thêm **Redirect URI**:
   ```
   Development: http://localhost:3000/api/oauth/buffer/callback
   Production: https://your-domain.com/api/oauth/buffer/callback
   ```

### Bước 3: Cấu hình .env.local

Thêm vào file `.env.local`:

```bash
# Buffer
BUFFER_CLIENT_ID=your_buffer_client_id_here
BUFFER_CLIENT_SECRET=your_buffer_client_secret_here
BUFFER_ACCESS_TOKEN=your_personal_access_token_here (optional)
BUFFER_API_URL=https://api.bufferapp.com/1
```

## 📝 Sử dụng Buffer trong App

### 1. Kết nối Buffer Account

```typescript
// Frontend: Trigger OAuth flow
const handleConnectBuffer = async () => {
  window.location.href = '/api/oauth/buffer?action=connect';
};
```

### 2. Schedule Post qua Buffer

```typescript
import { bufferService } from '@/lib/services/BufferService';

// Schedule a post
const result = await bufferService.schedulePost({
  profileIds: ['buffer_profile_id_1', 'buffer_profile_id_2'],
  content: 'Your post content here #hashtag',
  media: ['https://example.com/image.jpg'],
  scheduledAt: new Date('2025-10-20T10:00:00'),
  postNow: false
});

if (result.success) {
  console.log('Post scheduled!', result.data);
}
```

### 3. Get Connected Accounts

```typescript
const accounts = await bufferService.getConnectedAccounts();

console.log(accounts);
// {
//   success: true,
//   accounts: [
//     { id: '123', platform: 'facebook', username: 'MyPage' },
//     { id: '456', platform: 'twitter', username: '@myhandle' }
//   ]
// }
```

### 4. Get Pending/Sent Posts

```typescript
// Get pending posts
const pending = await bufferService.getPendingUpdates('profile_id');

// Get sent posts
const sent = await bufferService.getSentUpdates('profile_id');
```

## 🔄 OAuth Flow

### Step 1: User clicks "Connect Buffer"
```
User -> Frontend -> /api/oauth/buffer?action=connect
```

### Step 2: Redirect to Buffer
```
Backend -> Buffer OAuth -> User Login & Authorize
```

### Step 3: Callback with code
```
Buffer -> /api/oauth/buffer/callback?code=xxx&state=yyy
```

### Step 4: Exchange code for access token
```
Backend -> Buffer API -> Get Access Token -> Save to DB
```

### Step 5: Fetch user's profiles
```
Backend -> Buffer API -> Get Profiles -> Save to user_social_accounts
```

## 📊 Buffer API Endpoints Used

### Authentication
```
POST https://api.bufferapp.com/1/oauth2/token.json
```

### Get Profiles
```
GET https://api.bufferapp.com/1/profiles.json?access_token=xxx
```

### Create Post
```
POST https://api.bufferapp.com/1/updates/create.json
{
  "profile_ids": ["123", "456"],
  "text": "Post content",
  "media": { "photo": "url" },
  "scheduled_at": 1234567890
}
```

### Get Updates
```
GET https://api.bufferapp.com/1/profiles/{profile_id}/updates/pending.json
GET https://api.bufferapp.com/1/profiles/{profile_id}/updates/sent.json
```

## 🎯 Database Schema

Buffer accounts được lưu trong `user_social_accounts`:

```sql
{
  user_id: UUID,
  provider: 'buffer',
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram',
  account_name: 'MyPage',
  account_id: 'buffer_profile_id',
  access_token: 'encrypted_token',
  platform_account_id: 'actual_platform_id',
  metadata: {
    formatted_service: 'Facebook Page',
    timezone: 'America/New_York',
    buffer_profile_id: '123'
  }
}
```

## ⚙️ Buffer Service Methods

### Core Methods

```typescript
// Authentication & Setup
await bufferService.validateConnection()
await bufferService.getUser()
await bufferService.getProfiles()

// Post Management
await bufferService.createPost(params)
await bufferService.updatePost(updateId, params)
await bufferService.deletePost(updateId)
await bufferService.shareNow(updateId)

// Scheduling
await bufferService.getSchedule(profileId)
await bufferService.updateSchedule(profileId, schedules)

// Queue Management
await bufferService.getPendingUpdates(profileId)
await bufferService.getSentUpdates(profileId)
await bufferService.moveToTop(updateId)

// Helper Methods
await bufferService.schedulePost({...})
await bufferService.getConnectedAccounts()
```

## 🔐 Security

### Access Token Encryption
Access tokens được encrypt trước khi lưu database:

```typescript
import { encrypt, decrypt } from '@/lib/utils/encryption';

// Save
const encrypted = encrypt(accessToken);
await supabase.from('user_social_accounts').insert({
  access_token: encrypted
});

// Use
const decrypted = decrypt(stored.access_token);
```

## 📈 Buffer Plans & Limits

### Free Plan
- 3 social channels
- 10 scheduled posts per channel
- Basic analytics

### Essentials Plan ($6/month per channel)
- Unlimited scheduled posts
- Advanced analytics
- Team collaboration

### Team Plan ($12/month per channel)
- Multiple users
- Approval workflows
- Advanced features

⚠️ **Note:** Đảm bảo user hiểu về Buffer limits khi sử dụng

## 🧪 Testing

### Test Buffer Connection

```bash
# Create test file
node test-buffer-connection.js
```

```javascript
// test-buffer-connection.js
const { bufferService } = require('./src/lib/services/BufferService');

async function test() {
  // Validate connection
  const valid = await bufferService.validateConnection();
  console.log('Connection valid:', valid);
  
  // Get profiles
  const profiles = await bufferService.getProfiles();
  console.log('Profiles:', profiles);
  
  // Get accounts
  const accounts = await bufferService.getConnectedAccounts();
  console.log('Accounts:', accounts);
}

test();
```

## 🚨 Error Handling

### Common Errors

```typescript
// Invalid token
{
  success: false,
  error: 'unauthorized'
}

// Profile not found
{
  success: false,
  error: 'Profile not found'
}

// Rate limit exceeded
{
  success: false,
  error: 'Rate limit exceeded'
}
```

### Handle Errors

```typescript
const result = await bufferService.schedulePost(params);

if (!result.success) {
  if (result.error === 'unauthorized') {
    // Redirect to re-auth
  } else if (result.error.includes('rate limit')) {
    // Show rate limit message
  } else {
    // General error
  }
}
```

## 🎨 UI Components

### Add Buffer to Provider Selection

```tsx
// components/features/AddAccountModal.tsx
const providers = {
  buffer: {
    label: 'Buffer',
    icon: '🟣',
    description: 'Quản lý đa nền tảng qua Buffer',
    permissions: ['manage_all_profiles', 'schedule_posts']
  }
}
```

### Show Buffer Accounts

```tsx
// Show all platforms connected via Buffer
{bufferAccounts.map(account => (
  <div key={account.id}>
    <span>{account.platform}</span>
    <span>{account.username}</span>
    <Badge>via Buffer</Badge>
  </div>
))}
```

## 📚 References

- [Buffer API Documentation](https://buffer.com/developers/api)
- [Buffer OAuth Guide](https://buffer.com/developers/api/oauth)
- [Buffer Changelog](https://buffer.com/developers/api/changelog)

## ✅ Checklist

- [ ] Tạo Buffer Developer App
- [ ] Lấy Client ID và Client Secret
- [ ] Cấu hình Redirect URI
- [ ] Thêm credentials vào .env.local
- [ ] Test OAuth flow
- [ ] Test schedule post
- [ ] Test get accounts
- [ ] Verify encryption
- [ ] Test error handling
- [ ] Update UI với Buffer option

---

**Updated:** 2025-10-15  
**Status:** ✅ Buffer integration completed

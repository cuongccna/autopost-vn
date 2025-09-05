# 🔐 OAuth & User Management Implementation Guide

## 📋 Tổng quan kiến trúc

### 🎯 Vấn đề đã giải quyết:
- **Multi-user support**: Mỗi user có workspace riêng
- **OAuth flow hoàn chỉnh**: Facebook, Instagram, Zalo
- **Token management**: Auto-refresh, expiry handling
- **Security**: Row-level security, user isolation

## 🚀 Workflow cho người dùng mới

### 1. **Đăng ký tài khoản** 
```
User đăng ký → NextAuth → Session được tạo → Auto-create workspace
```

### 2. **Kết nối social media accounts**
```
User click "Kết nối Facebook" → OAuth Setup Modal → 
Facebook OAuth → Callback → Token saved → Account active
```

### 3. **Quản lý posts**
```
User tạo post → Chọn accounts → Post được link với user's accounts → 
Chỉ user đó thấy posts của mình
```

## 🛠️ Các Component đã tạo

### 1. **OAuthSetup.tsx**
- Modal hướng dẫn OAuth cho từng provider
- Handle OAuth callback results
- User-friendly error messages
- Requirements & permissions explanation

### 2. **UserManagementService.ts**
- Quản lý workspaces cho từng user
- Save/retrieve OAuth tokens securely
- Token refresh logic
- User isolation for data

### 3. **API Endpoints**

#### `/api/oauth/[provider]`
- `GET ?action=connect` → Redirect to OAuth
- `GET ?action=callback` → Handle OAuth callback

#### `/api/user/accounts`
- `GET` → Get user's connected accounts
- `DELETE ?id=accountId` → Disconnect account
- `POST` → Refresh token

### 4. **Database Schema**
```sql
autopostvn_user_workspaces      # User workspaces
autopostvn_user_social_accounts # OAuth accounts per user  
autopostvn_oauth_sessions       # OAuth flow state management
autopostvn_user_posts           # View: Posts with user context
```

## 🔧 Cách sử dụng

### 1. **Setup Environment Variables**
```env
# Facebook/Instagram
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret

# Zalo
ZALO_CLIENT_ID=your_zalo_app_id  
ZALO_CLIENT_SECRET=your_zalo_app_secret

# App URL for OAuth callbacks
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. **Run Database Migration**
```bash
# Execute migration file in Supabase SQL Editor
cat migrations/001_user_management.sql
```

### 3. **Update Component Usage**
```tsx
// In main app page
<AccountsManagement
  accounts={userAccounts}
  currentUserEmail={session.user.email}
  onConnectAccount={handleOAuthConnect}
  onDisconnectAccount={handleDisconnect}
  onRefreshToken={handleTokenRefresh}
/>
```

## 🔐 Bảo mật

### 1. **Row Level Security (RLS)**
- Users chỉ thấy data của chính họ
- Database policies enforce isolation
- No cross-user data leakage

### 2. **OAuth Security**
- State parameter validation
- Short-lived OAuth sessions (30 min)
- Secure token storage with encryption
- Automatic cleanup of expired tokens

### 3. **API Security**
- Session validation on all endpoints
- User email verification
- Sanitized error messages

## 📊 Luồng dữ liệu

### User Registration → Workspace Creation
```
1. User signs up with NextAuth
2. UserManagementService.getOrCreateUserWorkspace()
3. Default workspace settings applied
4. User ready to connect accounts
```

### OAuth Flow
```
1. User clicks "Connect Facebook"
2. OAuthSetup modal shows requirements
3. Redirect to Facebook OAuth
4. User grants permissions
5. Callback with code
6. Exchange code for tokens
7. Save account to database
8. User sees connected account
```

### Post Creation
```
1. User creates post
2. Selects their connected accounts
3. Post linked to user's account IDs
4. Only user can see/edit their posts
```

## 🎨 User Experience

### Cho người dùng mới:
1. **Onboarding clear**: Modal explain từng bước
2. **Requirements transparent**: Liệt kê yêu cầu OAuth
3. **Error handling**: Friendly error messages
4. **Success feedback**: Confirmation khi connect thành công

### Cho existing users:
1. **Account management**: Xem/disconnect/refresh tokens
2. **Multi-account support**: Kết nối multiple pages/accounts
3. **Status monitoring**: Token expiry warnings
4. **Seamless experience**: Auto-refresh tokens

## 🚧 Next Steps

### 1. **Enhanced Features**
- Bulk account management
- Account health monitoring
- Advanced permissions per account
- Team workspaces (sharing accounts)

### 2. **Monitoring & Analytics**
- OAuth success/failure rates
- Token refresh patterns  
- User engagement metrics
- Error tracking & alerts

### 3. **Provider Extensions**
- TikTok, LinkedIn, Twitter
- Custom webhook integrations
- Advanced posting features per platform

## ⚡ Development Commands

```bash
# Run migration
npm run migration:up

# Test OAuth flow
npm run dev
# Navigate to /app → Click "Kết nối Facebook"

# Check database
npm run db:studio

# Run tests
npm run test:oauth
```

## 🐛 Common Issues & Solutions

### OAuth Callback URL mismatch
```
Error: redirect_uri_mismatch
Solution: Update Facebook/Zalo app settings với correct callback URL
```

### Token expired
```
Error: OAuthException: Token expired
Solution: Automatic token refresh implemented in UserManagementService
```

### User isolation không work
```
Error: User thấy data của user khác
Solution: Check RLS policies và current_setting('app.current_user_email')
```

Với implementation này, bạn có một hệ thống OAuth hoàn chỉnh với multi-user support, security, và user experience tốt! 🎉

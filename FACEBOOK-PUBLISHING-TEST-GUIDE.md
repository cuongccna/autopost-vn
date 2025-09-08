# 🚀 Hướng Dẫn Test Publishing to Facebook Page

## 📋 Prerequisites Checklist

### ✅ Environment Setup
- [x] ENCRYPTION_KEY: 32 characters ✅
- [x] Facebook App ID: 758504150137739 ✅
- [x] Facebook App Secret: Configured ✅
- [x] Dev server: http://localhost:3000 ✅

### 🔧 Facebook App Requirements
- **App Status**: Development Mode
- **Valid OAuth Redirect URIs**: `http://localhost:3000/api/oauth/facebook?action=callback`
- **App Domains**: `localhost`
- **Permissions Required**:
  - `email, public_profile` (basic)
  - `pages_show_list` (see user's pages)
  - `pages_read_engagement` (read page data)
  - `pages_manage_posts` (for publishing - may need review)

---

## 🎯 Step-by-Step Testing Guide

### Step 1: Connect Facebook Account
1. **Open browser**: http://localhost:3000/app
2. **Login** to your app (create account if needed)
3. **Navigate to**: Account Management or Social Accounts
4. **Click**: "Connect Facebook" button
5. **OAuth Flow**:
   - Redirects to Facebook login
   - Login with your Facebook account
   - Grant permissions to the app
   - Should redirect back to app with success message

### Step 2: Verify Account Connection
1. **Check UI**: Facebook account should appear in connected accounts
2. **Check Database**: 
   ```sql
   SELECT * FROM autopostvn_social_accounts 
   WHERE provider = 'facebook' 
   ORDER BY created_at DESC;
   ```
3. **Verify Token**: Encrypted access_token should be stored

### Step 3: Test Page Publishing
1. **Navigate to**: http://localhost:3000/compose
2. **Create Test Post**:
   - Add text content (Vietnamese supported)
   - Upload image (optional)
   - Select Facebook account from dropdown
3. **Publish Options**:
   - **Publish Now**: Immediate posting
   - **Schedule**: Set future date/time
4. **Submit**: Click "Đăng bài" button

### Step 4: Verify Publication
1. **Check App Response**: Should show success message
2. **Check Facebook Page**: Visit your Facebook Page
3. **Verify Content**: Text, image, formatting should match
4. **Check Database**: 
   ```sql
   SELECT * FROM autopostvn_posts 
   WHERE platform = 'facebook' 
   ORDER BY created_at DESC;
   ```

---

## 🧪 Test Cases to Cover

### 📝 Text-Only Posts
```
Test content:
"🚀 Testing AutoPost VN - Facebook Integration
Vietnamese text: Đây là bài test tiếng Việt với emoji 🇻🇳
Hashtags: #AutoPostVN #SocialMedia #Testing"
```

### 🖼️ Image Posts
- Single image with caption
- Multiple images (carousel)
- Different image formats (JPG, PNG)
- Image with Vietnamese text overlay

### ⏰ Scheduled Posts
- Schedule for 5 minutes from now
- Schedule for tomorrow
- Verify scheduling works correctly

### 🎯 Advanced Features
- Posts with links
- Posts with mentions
- Posts with location (if supported)

---

## 🔍 Debugging Common Issues

### Issue: "redirect_uri_mismatch"
**Solution**: 
1. Go to Facebook App Settings
2. Add exact redirect URI: `http://localhost:3000/api/oauth/facebook?action=callback`
3. Save and try again

### Issue: "insufficient permissions"
**Solution**:
1. Check app permissions in Facebook Developer Console
2. Ensure user granted all required permissions
3. May need to request `pages_manage_posts` permission

### Issue: "Page not found" when publishing
**Solution**:
1. Verify user has admin access to the Facebook Page
2. Check if page permissions were granted during OAuth
3. May need to re-connect account with page permissions

### Issue: "Token expired"
**Solution**:
1. Facebook tokens expire, need to refresh
2. Re-connect account through OAuth flow
3. Implement token refresh mechanism

---

## 📊 Expected Behavior

### ✅ Success Indicators
- OAuth completes without errors
- Account appears in connected accounts list
- Posts publish successfully to Facebook Page
- Database records created correctly
- User receives success notifications

### ❌ Error Indicators
- OAuth redirect fails
- "Access denied" messages
- Posts fail to publish
- Database errors
- Network/API errors

---

## 🔧 Development Notes

### Facebook Graph API Endpoints Used
- **OAuth**: `https://www.facebook.com/v18.0/dialog/oauth`
- **Token Exchange**: `https://graph.facebook.com/v18.0/oauth/access_token`
- **Page Publishing**: `https://graph.facebook.com/v18.0/{page-id}/feed`
- **Media Upload**: `https://graph.facebook.com/v18.0/{page-id}/photos`

### Token Management
- Access tokens encrypted in database
- Tokens have expiration times
- May need refresh token implementation
- Test both short-lived and long-lived tokens

### Error Handling
- Network failures
- API rate limits
- Invalid tokens
- Permission errors
- Media upload failures

---

## 🚀 Quick Test Commands

### Check Database Connection
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
client.from('autopostvn_social_accounts').select('*').then(console.log);
"
```

### Test Token Encryption
```bash
node -e "
const crypto = require('crypto');
const key = process.env.ENCRYPTION_KEY;
console.log('Key length:', key.length);
console.log('Key valid:', key.length === 32);
"
```

---

## 📱 Mobile Testing

### Responsive Design
- Test OAuth flow on mobile browser
- Verify compose page works on mobile
- Check image upload on mobile devices

### Cross-Browser Testing
- Chrome (primary)
- Firefox
- Safari (if available)
- Edge

---

## 🎯 Next Steps After Success

1. **Test Instagram Publishing**: Similar flow for Instagram
2. **Test Zalo Publishing**: Vietnamese platform
3. **Implement Bulk Publishing**: Multiple platforms at once
4. **Add Analytics**: Track post performance
5. **Implement Scheduling**: Advanced scheduling features

---

## 📞 Support & Debugging

If you encounter issues:
1. Check browser developer console
2. Check terminal logs from dev server
3. Verify Facebook App configuration
4. Test with different Facebook accounts
5. Check Supabase database logs

**Ready to start testing! 🚀**

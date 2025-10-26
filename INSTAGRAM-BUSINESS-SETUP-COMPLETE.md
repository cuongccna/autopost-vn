# 📸 INSTAGRAM BUSINESS SETUP GUIDE

## 🎯 **Step-by-Step Instagram Business Setup**

### **Step 1: Convert to Instagram Business Account**

1. **Mở Instagram app trên điện thoại**
   - Đăng nhập vào account bạn muốn sử dụng

2. **Chuyển sang Professional Account**
   ```
   Profile → Settings (⚙️) → Account type and tools
   → Switch to Professional Account
   → Choose "Business" (hoặc "Creator")
   → Select category (e.g., "Website", "Marketing Agency")
   → Skip contact info (hoặc điền nếu muốn)
   ```

3. **Verify Account Type**
   - Profile hiện "Professional Dashboard" button
   - Settings có "Business" section

---

### **Step 2: Link Instagram to Facebook Page**

1. **Create/Use Existing Facebook Page**
   - Go to: https://www.facebook.com/pages/create
   - Hoặc dùng 1 trong 7 Pages đã connect (recommended)

2. **Link Instagram to Page**
   ```
   Facebook Page → Settings → Instagram
   → Connect Account
   → Login to Instagram
   → Authorize
   ```

3. **Verify Connection**
   - Instagram Settings → Account → Linked accounts → Facebook
   - Should show connected Page name

---

### **Step 3: Get Instagram Business Account ID**

**Method 1: Via Facebook Graph API Explorer**

1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your App: "AutoPostVN"
3. Get Page Access Token:
   ```
   GET /{page-id}?fields=instagram_business_account
   ```
4. Response:
   ```json
   {
     "instagram_business_account": {
       "id": "17841234567890123"  // ← This is your IG Business ID
     }
   }
   ```

**Method 2: Via AutoPost VN OAuth**
- Connect Facebook → Automatically fetch Instagram Business ID
- We'll implement this in OAuth callback

---

### **Step 4: Facebook App Configuration**

**Required Permissions:**

1. **Facebook Login** tab:
   - ✅ `instagram_basic`
   - ✅ `instagram_content_publish`
   - ✅ `pages_show_list` (already have)
   - ✅ `pages_read_engagement` (already have)

2. **Instagram Graph API** product:
   - Add "Instagram Graph API" product to app
   - Configure permissions

**App Review Status:**
```
Development Mode:
  ✅ Can test with accounts that have role in app
  ✅ Test Users, Admins, Developers
  ❌ Cannot test with public accounts

Production:
  ⏳ Need App Review for instagram_content_publish
```

---

### **Step 5: Add Test Users to App**

1. **Facebook Developers Console**
   ```
   App Dashboard → Roles → Test Users
   → Add Test Users
   ```

2. **Or use your own account**
   ```
   App Dashboard → Roles → Administrators
   → Add yourself as Admin/Developer/Tester
   ```

---

## 🔧 **CONFIGURATION CHECKLIST**

### **Instagram Account:**
- [ ] Converted to Business/Creator account
- [ ] Linked to Facebook Page
- [ ] Has IG Business Account ID
- [ ] Can post from app (test manually first)

### **Facebook Page:**
- [ ] Created and active
- [ ] Instagram account linked
- [ ] Has Page ID
- [ ] Has Page Access Token

### **Facebook App:**
- [ ] Instagram Graph API product added
- [ ] Permissions configured:
  - [ ] instagram_basic
  - [ ] instagram_content_publish
  - [ ] pages_show_list
  - [ ] pages_read_engagement
- [ ] Test user added (or you're admin)

---

## 🧪 **MANUAL TEST (Before OAuth)**

Test Instagram posting manually để verify setup:

**1. Get Page Access Token:**
```bash
curl -X GET "https://graph.facebook.com/v21.0/me/accounts?access_token=YOUR_USER_TOKEN"
```

**2. Get Instagram Business Account ID:**
```bash
curl -X GET "https://graph.facebook.com/v21.0/{PAGE_ID}?fields=instagram_business_account&access_token={PAGE_TOKEN}"
```

**3. Create Media Container (Photo):**
```bash
curl -X POST "https://graph.facebook.com/v21.0/{IG_BUSINESS_ID}/media" \
  -d "image_url=https://example.com/image.jpg" \
  -d "caption=Test post from AutoPost VN" \
  -d "access_token={PAGE_TOKEN}"

# Response:
{
  "id": "17895695668004550"  // Creation ID
}
```

**4. Publish Media:**
```bash
curl -X POST "https://graph.facebook.com/v21.0/{IG_BUSINESS_ID}/media_publish" \
  -d "creation_id=17895695668004550" \
  -d "access_token={PAGE_TOKEN}"

# Response:
{
  "id": "17855590849772952"  // Published media ID
}
```

**If all steps work → Setup is correct!**

---

## 📊 **EXPECTED DATA STRUCTURE**

### **After OAuth, database should have:**

```sql
-- Instagram accounts in autopostvn_social_accounts
SELECT 
  id,
  name,                    -- Instagram username
  provider,                -- 'instagram'
  provider_id,             -- IG Business Account ID
  token_encrypted,         -- Page Access Token (encrypted)
  metadata                 -- { pageId: '...', pageName: '...' }
FROM autopostvn_social_accounts
WHERE provider = 'instagram';
```

### **Metadata format:**
```json
{
  "pageId": "123456789",
  "pageName": "My Business Page",
  "igUsername": "my_instagram_handle",
  "igBusinessAccountId": "17841234567890123"
}
```

---

## 🚨 **COMMON ISSUES**

### **Issue 1: "Account not eligible for Instagram API"**
**Cause:** Personal account or not linked to Page  
**Solution:** Convert to Business → Link to Page

### **Issue 2: "Invalid Instagram Business Account ID"**
**Cause:** Using Instagram User ID instead of Business ID  
**Solution:** Get ID via `/{page-id}?fields=instagram_business_account`

### **Issue 3: "Insufficient permissions"**
**Cause:** Missing instagram_content_publish permission  
**Solution:** Add permission in App Dashboard → Request in OAuth flow

### **Issue 4: "Image URL not accessible"**
**Cause:** Instagram can't fetch image from URL  
**Solution:** Use publicly accessible HTTPS URLs

---

## ✅ **READY FOR OAUTH?**

Once you have:
- ✅ Instagram Business account
- ✅ Linked to Facebook Page
- ✅ Manual posting works
- ✅ App has Instagram permissions

→ **You're ready to implement OAuth!**

---

## 📝 **NEXT STEPS**

1. Complete Instagram Business setup (this guide)
2. Update OAuth callback to fetch Instagram accounts
3. Test posting from AutoPost VN
4. Document any issues

---

*Updated: 25/10/2025*

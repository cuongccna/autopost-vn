# ❌ INSTAGRAM NOT LINKED - TROUBLESHOOTING

## 🚨 Vấn đề hiện tại

Graph API response:
```json
{
  "id": "763815553484731"
}
```

**Thiếu:** `instagram_business_account` field

→ **Instagram chưa được link đến Page, hoặc chưa là Business account**

---

## ✅ GIẢI PHÁP - STEP BY STEP

### **Step 1: Verify Instagram Account Type**

1. **Mở Instagram app trên điện thoại**
2. Đăng nhập vào @cuongnavan
3. Go to Profile → Settings ⚙️
4. **Account** → Kiểm tra:

   ❓ Có thấy **"Switch to Professional Account"** KHÔNG?
   
   - **CÓ** → Instagram đang là Personal account
     - ✅ Click vào và chuyển sang **Business**
     - Chọn category: "Website" / "Marketing" / etc.
     
   - **KHÔNG** → Kiểm tra tiếp:
     - Có **"Professional Dashboard"** button không?
     - Settings có **"Business"** hoặc **"Creator"** section không?
     - Nếu CÓ → Đã là Professional ✅
     - Nếu KHÔNG → Chưa chuyển đổi ❌

---

### **Step 2: Check Linked Facebook Page**

**Trong Instagram app:**

1. Settings → Account → **Linked Accounts**
2. Tap **Facebook**
3. **Kiểm tra:**

   ❓ Có hiển thị tên trang **"Autopost"** không?
   
   - **CÓ** → Linked đúng ✅
   - **KHÔNG** → Cần re-link:
     - Tap vào Facebook
     - Login nếu cần
     - **QUAN TRỌNG:** Chọn đúng Page **"Autopost"**
     - Authorize

---

### **Step 3: Verify từ Facebook Page**

1. Vào Facebook Page: https://www.facebook.com/763815553484731
2. Settings → **Instagram**
3. **Kiểm tra:**

   ❓ Có thấy account @cuongnavan trong "Connected Instagram" không?
   
   - **CÓ** → Link thành công ✅
   - **KHÔNG** → Click **"Connect Account"**:
     - Login Instagram
     - Authorize
     - Chọn account @cuongnavan

---

### **Step 4: Re-test với Graph API**

Sau khi link xong, test lại:

**Query:**
```
763815553484731?fields=instagram_business_account{id,username,name}
```

**Expected Response:**
```json
{
  "instagram_business_account": {
    "id": "17841xxxxxxxxxx",  // ← Instagram Business ID
    "username": "cuongnavan"
  },
  "id": "763815553484731"
}
```

**Nếu vẫn không có** `instagram_business_account`:
- Instagram chưa là Business account
- Hoặc link chưa được authorize đúng permissions

---

## 🎯 CHECKLIST

Kiểm tra từng bước:

- [ ] Instagram @cuongnavan là **Business** hoặc **Creator** account
- [ ] Instagram Settings → Linked Accounts → Facebook → Hiển thị **"Autopost"**
- [ ] Facebook Page "Autopost" → Settings → Instagram → Hiển thị **@cuongnavan**
- [ ] Graph API query có trả về `instagram_business_account`

---

## 🔧 COMMON ISSUES

### Issue 1: "Instagram is Personal account"
**Solution:**
```
Instagram app → Settings → Account type and tools
→ Switch to Professional Account
→ Choose "Business"
```

### Issue 2: "Linked to wrong Facebook Page"
**Solution:**
```
Instagram → Settings → Linked Accounts → Facebook
→ Tap Facebook → Select correct Page "Autopost"
```

### Issue 3: "Connection not authorized"
**Solution:**
```
Facebook Page → Settings → Instagram → Connect Account
→ Login and authorize all permissions
```

### Issue 4: "Graph API missing field"
**Cause:** Instagram Business account ID chỉ có khi:
- Instagram là Business/Creator account ✅
- Linked to Facebook Page ✅
- Page has manage permissions ✅

---

## 📱 MOBILE APP SCREENSHOTS NEEDED

Để debug, share screenshots của:

1. **Instagram app:**
   - Settings → Account (show account type)
   - Settings → Linked Accounts → Facebook

2. **Facebook app/web:**
   - Page "Autopost" → Settings → Instagram

Với screenshots này, tôi có thể xác định chính xác vấn đề!

---

## 🚀 QUICK FIX

**Cách nhanh nhất:**

1. **Unlink Instagram khỏi Facebook:**
   - Instagram app → Settings → Linked Accounts → Facebook → Unlink

2. **Convert Instagram to Business:**
   - Settings → Account → Switch to Professional Account → Business

3. **Re-link to Facebook Page:**
   - Instagram → Settings → Linked Accounts → Facebook
   - Login → **Chọn trang "Autopost"** (ID: 763815553484731)
   - Authorize

4. **Test lại:**
   ```bash
   node get-instagram-ids.js
   ```

---

**Next:** Share screenshots hoặc kết quả sau khi làm theo steps trên! 📸

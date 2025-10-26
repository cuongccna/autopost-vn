# 🔗 LINK INSTAGRAM BUSINESS TO FACEBOOK PAGE

## ✅ Đã hoàn thành:
- Instagram đã chuyển sang Business account

## 📋 Bước tiếp theo:

### **Option 1: Link từ Instagram (Recommended)**

1. **Instagram app → Settings**
2. **Business tools and controls** (hoặc "For professionals")
3. Tìm **"Connected accounts"** hoặc **"Linked accounts"**
4. Chọn **Facebook**
5. Login Facebook nếu chưa login
6. **QUAN TRỌNG:** Chọn Page **"Autopost"** (ID: 763815553484731)
7. Authorize connection

---

### **Option 2: Link từ Facebook Page**

1. **Mở Facebook Page "Autopost":**
   - https://facebook.com/763815553484731

2. **Page Settings → Instagram**
   - Click **"Connect Account"**
   - Login Instagram @cuongnavan
   - Authorize

3. **Grant permissions:**
   - Allow Page to post on Instagram
   - Allow Page to manage Instagram comments
   - Allow Page to see Instagram insights

---

### **Option 3: Link từ Meta Business Suite**

1. **Mở Meta Business Suite:**
   - https://business.facebook.com/latest/settings/pages

2. **Select Page "Autopost"**

3. **Instagram accounts → Connect**

4. **Login và authorize**

---

## 🧪 Verify Connection

Sau khi link xong, kiểm tra:

### **A. Từ Instagram:**
```
Instagram → Settings → Linked accounts → Facebook
→ Should show: "Autopost"
```

### **B. Từ Facebook:**
```
Facebook Page "Autopost" → Settings → Instagram
→ Should show: @cuongnavan connected
```

### **C. Test bằng Graph API:**

Run script:
```bash
node get-instagram-ids.js
```

**Expected output:**
```
✅ Instagram Business Account FOUND! 🎉
   📸 Username: @cuongnavan
   🆔 Business ID: 17841xxxxxxxxxx
```

---

## 🚨 Common Issues

### **Issue: "This Instagram account is already connected to another Page"**
**Solution:** 
- Disconnect Instagram from old Page first
- Then connect to "Autopost" Page

### **Issue: "You don't have permission to link this account"**
**Solution:**
- Make sure you're admin of both:
  - Instagram Business account
  - Facebook Page "Autopost"

### **Issue: "Instagram account not eligible"**
**Solution:**
- Make sure Instagram is Business (not Creator)
- Or Creator account can also work, but Business is better

---

## 📸 Screenshot checklist

Sau khi link, bạn sẽ thấy:

1. **Instagram Settings:**
   - ✅ Linked accounts → Facebook → "Autopost"

2. **Facebook Page Settings:**
   - ✅ Instagram → @cuongnavan (Connected)
   - ✅ Can toggle "Allow Instagram posting"

3. **Graph API Explorer:**
   - ✅ Query `763815553484731?fields=instagram_business_account`
   - ✅ Response has `instagram_business_account.id`

---

## 🎯 Next Steps After Linking

1. ✅ Verify connection: `node get-instagram-ids.js`
2. 📝 Update OAuth callback to save Instagram accounts
3. 🧪 Test posting to Instagram
4. 🚀 Production ready!

---

*Updated: 25/10/2025*

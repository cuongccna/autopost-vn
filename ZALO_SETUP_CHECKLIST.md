# Zalo OA Setup Checklist ✅

## 🎯 Các bước cần thực hiện:

### ☐ 0. Xác thực tài khoản Zalo (QUAN TRỌNG!)
- [ ] Xác thực số điện thoại trong app Zalo
- [ ] Xác thực email (nếu cần)
- [ ] Xác thực danh tính (upload CMND/CCCD)
- [ ] Đăng ký Developer account
- [ ] Chờ duyệt (1-3 ngày)

### ☐ 1. Tạo Zalo Developer Account
- [ ] Đăng ký tại https://developers.zalo.me/
- [ ] Xác thực số điện thoại
- [ ] Xác thực email

### ☐ 2. Tạo Official Account
- [ ] Truy cập https://oa.zalo.me/
- [ ] Tạo Official Account mới
- [ ] Hoàn thành thông tin OA (tên, mô tả, avatar)
- [ ] Chờ duyệt (nếu cần)

### ☐ 3. Tạo App trong Developer Console
- [ ] Click "Tạo ứng dụng"
- [ ] Chọn "Official Account App"
- [ ] Điền thông tin app:
  - Tên: `AutoPost VN`
  - Mô tả: `Auto post management`
  - Website: `http://localhost:3000`

### ☐ 4. Kết nối OA với App
- [ ] Trong Developer Console → "Official Account" 
- [ ] Click "Kết nối OA"
- [ ] Chọn OA vừa tạo
- [ ] Xác nhận kết nối

### ☐ 5. Cấu hình OAuth
- [ ] Thêm Redirect URI: `http://localhost:3000/api/oauth/zalo?action=callback`
- [ ] Thêm Domain: `localhost`
- [ ] Cấu hình Permissions:
  - [x] Quản lý tin nhắn
  - [x] Đăng bài viết  
  - [x] Xem thông tin OA
  - [x] Quản lý followers

### ☐ 6. Lấy Credentials
- [ ] Copy **App ID**: `_______________`
- [ ] Copy **App Secret**: `_______________`

### ☐ 7. Cập nhật .env.local
```bash
ZALO_APP_ID=your_app_id_here
ZALO_APP_SECRET=your_app_secret_here
```

### ☐ 8. Test Integration
- [ ] Restart server: `npm run dev`
- [ ] Test OAuth: `http://localhost:3000/api/oauth/zalo?action=connect`
- [ ] Kiểm tra logs thành công
- [ ] Verify account hiển thị trong dashboard

---

## 📞 Hỗ trợ:

**Nếu gặp vấn đề:**
1. Check Zalo Developer Docs: https://developers.zalo.me/docs
2. Kiểm tra OAuth callback URL chính xác
3. Verify OA đã được kết nối với app
4. Check logs trong terminal để debug

**Ready to test**: Sau khi hoàn thành checklist, Zalo OA sẽ tích hợp hoàn chỉnh vào AutoPost VN! 🚀

# Hướng dẫn xác thực tài khoản Zalo Developer 🔐

## ❌ **Lỗi gặp phải:**
```
Tài khoản Zalo chưa được xác thực.
Vui lòng xác thực tài khoản Zalo trước khi tạo ứng dụng.
```

## ✅ **Cách khắc phục:**

### 🔑 Bước 1: Xác thực số điện thoại Zalo

1. **Mở app Zalo trên điện thoại**
2. Vào **"Cá nhân"** (Profile) → **"Cài đặt"** (Settings)
3. Chọn **"Bảo mật"** (Security)
4. Tìm **"Xác thực số điện thoại"** 
5. Nếu chưa xác thực → Click **"Xác thực ngay"**
6. Nhập mã OTP được gửi về số điện thoại
7. Hoàn thành xác thực

### 📧 Bước 2: Xác thực email (nếu cần)

1. Trong app Zalo → **"Cài đặt"** → **"Bảo mật"**
2. Chọn **"Email"**
3. Thêm email và xác thực qua link được gửi
4. Click vào link xác thực trong email
5. Hoàn thành liên kết email

### 🏢 Bước 3: Xác thực danh tính (cho Developer)

#### Đối với **Cá nhân**:
1. Truy cập https://developers.zalo.me/
2. Vào **"Hồ sơ"** (Profile) hoặc **"Cài đặt tài khoản"**
3. Chọn **"Xác thực danh tính"**
4. Upload **CMND/CCCD** (mặt trước + mặt sau)
5. Chụp ảnh selfie cầm CMND/CCCD
6. Điền đầy đủ thông tin cá nhân
7. Submit và chờ duyệt (1-3 ngày làm việc)

#### Đối với **Doanh nghiệp**:
1. Upload **Giấy phép kinh doanh**
2. Upload **Quyết định thành lập**
3. Thông tin người đại diện pháp luật
4. Submit và chờ duyệt (3-7 ngày làm việc)

### 📱 Bước 4: Nâng cấp tài khoản Developer

1. Sau khi xác thực danh tính thành công
2. Vào https://developers.zalo.me/
3. Click **"Đăng ký Developer"** hoặc **"Upgrade to Developer"**
4. Điền thông tin:
   - Lý do sử dụng API
   - Mô tả dự án/ứng dụng
   - Website/Portfolio (nếu có)
5. Đồng ý điều khoản sử dụng
6. Submit đăng ký

## ⏱️ **Thời gian xử lý:**

- **Xác thực số điện thoại**: Ngay lập tức
- **Xác thực email**: 1-5 phút
- **Xác thực danh tính cá nhân**: 1-3 ngày làm việc
- **Xác thực doanh nghiệp**: 3-7 ngày làm việc
- **Duyệt Developer account**: 1-2 ngày làm việc

## 🔍 **Kiểm tra trạng thái xác thực:**

### Trong app Zalo:
1. **"Cá nhân"** → **"Cài đặt"** → **"Bảo mật"**
2. Kiểm tra các mục:
   - ✅ **Số điện thoại**: Đã xác thực
   - ✅ **Email**: Đã xác thực  
   - ✅ **Danh tính**: Đã xác thực

### Trên Developer Console:
1. Vào https://developers.zalo.me/
2. Check banner/notification về trạng thái tài khoản
3. Profile sẽ hiển thị **"Verified"** hoặc **"Đã xác thực"**

## 🚨 **Lưu ý quan trọng:**

### Tài liệu cần chuẩn bị:
- **CMND/CCCD** còn hạn (scan rõ ràng)
- **Ảnh selfie** cầm CMND/CCCD (rõ mặt, rõ giấy tờ)
- **Email** hoạt động để nhận xác thực
- **Số điện thoại** đang sử dụng

### Yêu cầu ảnh chụp:
- Ánh sáng tốt, không bị mờ
- Thông tin trên CMND/CCCD phải đọc được rõ
- Ảnh selfie phải thấy rõ mặt và giấy tờ
- Format: JPG, PNG (dưới 5MB)

### Lý do thường bị từ chối:
- Ảnh mờ, không rõ nét
- Thông tin không khớp
- Giấy tờ hết hạn
- Ảnh selfie không đúng yêu cầu

## 🛠️ **Alternative Solutions:**

### Tùy chọn 1: Sử dụng tài khoản khác
- Dùng tài khoản Zalo khác đã được xác thực
- Tài khoản có thể của đồng nghiệp/bạn bè (với sự đồng ý)

### Tùy chọn 2: Test với Zalo API công khai
- Sử dụng Zalo Webhook samples để test
- Test với public APIs (không cần app riêng)

### Tùy chọn 3: Phát triển từng phần
- Hoàn thiện Facebook + Instagram trước
- Bổ sung Zalo sau khi xác thực xong

## 📞 **Hỗ trợ:**

### Zalo Developer Support:
- **Email**: developer@zalo.me
- **Hotline**: 1900 561 558
- **Forum**: https://developers.zalo.me/forum/

### Các vấn đề thường gặp:
1. **"Không nhận được OTP"**: Kiểm tra số điện thoại, thử lại sau 1 phút
2. **"Ảnh không hợp lệ"**: Chụp lại với ánh sáng tốt hơn
3. **"Thông tin không khớp"**: Đảm bảo tên trong Zalo khớp với CMND
4. **"Tài khoản bị khóa"**: Liên hệ support để được hỗ trợ

---

**Khuyến nghị**: Thực hiện xác thực ngay để có thể tạo Zalo app sớm nhất. Trong lúc chờ, bạn có thể tiếp tục hoàn thiện Facebook và Instagram integration! 🚀

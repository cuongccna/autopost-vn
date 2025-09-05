'use client';

import { useState } from 'react';

interface Template {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

interface Industry {
  id: string;
  name: string;
  icon: string;
  color: string;
  templates: Template[];
}

const INDUSTRIES: Industry[] = [
  {
    id: 'ecommerce',
    name: 'Thương mại điện tử',
    icon: '🛒',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    templates: [
      {
        id: 'flash-sale',
        title: 'Flash Sale Khủng',
        content: `🔥 **FLASH SALE KHỦNG - CHỈ CÒN 24H** 🔥

⚡ Giảm đến **70%** cho tất cả sản phẩm
🎯 Miễn phí ship toàn quốc đơn từ 99k
💎 Tặng voucher 200k cho 100 khách hàng đầu tiên

**Nhanh tay kẻo lỡ!** 👆
Đặt hàng ngay: [Link shop]

#FlashSale #GiamGia #MienPhiShip`,
        tags: ['sale', 'khuyến mãi', 'cấp bách']
      },
      {
        id: 'product-review',
        title: 'Đánh giá sản phẩm',
        content: `**REVIEW CHÂN THẬT - SẢN PHẨM HOT**

## Tại sao khách hàng yêu thích sản phẩm này?

✅ **Chất lượng cao cấp** - Chỉ từ 299k
✅ **Giao hàng nhanh** - Nhận hàng trong 24h  
✅ **Bảo hành 12 tháng** - Yên tâm sử dụng
✅ **4.9/5 sao** từ 2,000+ đánh giá

> "Mình đã dùng 3 tháng, cực kỳ hài lòng!" - Chị Mai, HN

**Đặt ngay hôm nay!** 📞
Hotline: 0123.456.789

#Review #ChatLuong #UyTin`,
        tags: ['review', 'chất lượng', 'testimonial']
      }
    ]
  },
  {
    id: 'fnb',
    name: 'Ẩm thực',
    icon: '🍽️',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    templates: [
      {
        id: 'menu-today',
        title: 'Menu hôm nay',
        content: `🍜 **MENU NGON HÔM NAY** 🍜

## Đặc biệt trong ngày:
• **Phở bò đặc biệt** - 45k
• **Bún bò Huế** - 40k  
• **Cơm tấm sườn nướng** - 50k
• **Bánh mì thịt nướng** - 25k

🎁 **Khuyến mãi hôm nay:**
> Mua 2 tặng 1 nước ngọt
> Giảm 10% cho đơn từ 200k

📍 **Địa chỉ:** 123 Nguyễn Văn A, Q1
⏰ **Giờ mở cửa:** 6:00 - 22:00

#MonNgon #MenuHomNay #KhuyenMai`,
        tags: ['menu', 'ẩm thực', 'khuyến mãi']
      },
      {
        id: 'food-story',
        title: 'Câu chuyện món ăn',
        content: `👨‍🍳 **CÂU CHUYỆN ĐẰNG SAU MÓN PHỞ TRUYỀN THỐNG**

## Bí quyết nồi nước dùng 20 năm

Từ năm 2004, bác Minh đã **nung nấu từng giọt nước dùng** với:
- Xương bò hun khói 12 tiếng
- Gia vị truyền thống gia đình
- Tình yêu và tâm huyết của người làm nghề

> "Mỗi tô phở là một câu chuyện, mỗi khách hàng là một người bạn" - Bác Minh

**Đến và cảm nhận sự khác biệt!** ✨

📞 Đặt bàn: 0987.654.321

#PhoTruyenThong #CauChuyenAmThuc #TinhYeuNgheNghiep`,
        tags: ['story', 'truyền thống', 'cảm xúc']
      }
    ]
  },
  {
    id: 'beauty',
    name: 'Làm đẹp',
    icon: '💄',
    color: 'bg-pink-50 text-pink-700 border-pink-200',
    templates: [
      {
        id: 'skincare-tips',
        title: 'Tips chăm sóc da',
        content: `✨ **5 BƯỚC CHĂM SÓC DA GLOWING TRONG MÙA HÈ** ✨

## Routine sáng:
1️⃣ **Làm sạch nhẹ nhàng** - Gel rửa mặt không xà phòng
2️⃣ **Toner cân bằng** - Loại bỏ bụi bẩn còn sót lại  
3️⃣ **Serum Vitamin C** - Chống oxy hóa, sáng da
4️⃣ **Kem dưỡng ẩm** - Cấp nước cho da
5️⃣ **Chống nắng SPF 50+** - Bảo vệ khỏi tia UV

💡 **Pro tip:** Uống đủ 2L nước/ngày để da luôn căng mọng!

Bạn đã có routine chăm sóc da chưa? 👇

#SkinCare #LamdepTuNhien #TipsLamDep`,
        tags: ['skincare', 'tips', 'làm đẹp']
      },
      {
        id: 'makeup-tutorial',
        title: 'Hướng dẫn makeup',
        content: `💋 **MAKEUP TÔNG CAM ĐÀO - XU HƯỚNG HOT 2024** 💋

## Các bước thực hiện:

### Bước 1: Chuẩn bị
- Primer để lót da mịn màng
- Foundation tone da tự nhiên

### Bước 2: Màu mắt  
- Eyeshadow cam đào nhẹ nhàng
- Kẻ mắt nâu thay vì đen
- Mascara tông nâu ấm

### Bước 3: Hoàn thiện
- Blush cam đào tự nhiên  
- Lip tint màu cam coral

**Kết quả:** Look tươi tắn, phù hợp mọi dịp! ✨

Video tutorial chi tiết tại story! 📹

#MakeupTutorial #TongCamDao #XuHuong2024`,
        tags: ['makeup', 'tutorial', 'xu hướng']
      }
    ]
  },
  {
    id: 'fitness',
    name: 'Thể hình & Sức khỏe',
    icon: '💪',
    color: 'bg-green-50 text-green-700 border-green-200',
    templates: [
      {
        id: 'workout-plan',
        title: 'Kế hoạch tập luyện',
        content: `🔥 **KẾ HOẠCH TẬP 7 NGÀY - GIẢM MỠ TĂNG CƠ** 🔥

## Lịch tập trong tuần:

**Thứ 2 - Ngực & Tay sau:**
- Push up: 3 sets x 15 reps
- Dips: 3 sets x 12 reps  
- Triceps extension: 3 sets x 15 reps

**Thứ 4 - Lưng & Tay trước:**
- Pull up: 3 sets x 10 reps
- Rowing: 3 sets x 15 reps
- Biceps curl: 3 sets x 15 reps

**Thứ 6 - Chân & Vai:**
- Squat: 3 sets x 20 reps
- Lunge: 3 sets x 15 reps/chân
- Shoulder press: 3 sets x 12 reps

**Nghỉ ngơi:** Thứ 3, 5, 7, CN

💡 **Lưu ý:** Khởi động 5 phút trước tập!

#Workout #GiamCan #TangCo`,
        tags: ['workout', 'kế hoạch', 'fitness']
      },
      {
        id: 'nutrition-guide',
        title: 'Hướng dẫn dinh dưỡng',
        content: `🥗 **THỰC ĐơN CLEAN EATING - KHỎE ĐẸP TỪ BÊN TRONG** 🥗

## Menu 1 ngày chuẩn:

### Sáng (7h):
- 1 bát yến mạch + chuối + hạt chia
- 1 ly nước ấm + chanh

### Trưa (12h):  
- 150g ức gà nướng
- 1 chén cơm gạo lứt
- Rau củ luộc/nướng
- 1 quả táo

### Tối (18h):
- Salad rau mầm + cá hồi nướng
- 1 ly sữa hạnh nhân không đường

💧 **Nhớ uống đủ 2-3L nước/ngày!**

> "Cơ thể khỏe mạnh là nền tảng của mọi thành công"

#CleanEating #DinhDuong #SongKhoe`,
        tags: ['nutrition', 'clean eating', 'sức khỏe']
      }
    ]
  },
  {
    id: 'tech',
    name: 'Công nghệ',
    icon: '💻',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    templates: [
      {
        id: 'tech-news',
        title: 'Tin tức công nghệ',
        content: `🚀 **TECH NEWS: iPhone 16 VỪA RA MẮT - CÓ GÌ HOT?** 🚀

## Điểm nổi bật của iPhone 16:

⚡ **Chip A18 Bionic** - Hiệu năng vượt trội
📸 **Camera AI nâng cấp** - Chụp ảnh như pro
🔋 **Pin 20% lớn hơn** - Sử dụng cả ngày
🎮 **Hỗ trợ gaming** - Chơi game mượt mà

## Giá bán tại Việt Nam:
- iPhone 16: 22.990.000đ
- iPhone 16 Plus: 25.990.000đ  
- iPhone 16 Pro: 28.990.000đ
- iPhone 16 Pro Max: 34.990.000đ

**Bạn có nâng cấp không?** 💭
Comment chia sẻ ý kiến nhé!

#iPhone16 #Apple #TechNews #CongNghe`,
        tags: ['tech news', 'apple', 'smartphone']
      },
      {
        id: 'tech-tips',
        title: 'Mẹo công nghệ',
        content: `💡 **5 MẸO HAY VỚI SMARTPHONE MÀ 90% NGƯỜI DÙNG CHƯA BIẾT** 💡

## Mẹo thực tế cực hay:

### 1. Tạo shortcut nhanh
> Vuốt xuống từ góc phải để mở Control Center

### 2. Chụp ảnh màn hình dài
> Chụp screenshot → chọn "Full Page" → Save

### 3. Tìm điện thoại bằng Apple Watch  
> Double tap Digital Crown → điện thoại sẽ kêu

### 4. Sạc nhanh hơn 50%
> Bật chế độ máy bay khi sạc

### 5. Tiết kiệm pin hiệu quả
> Settings → Battery → Low Power Mode

**Bạn đã biết mẹo nào rồi?** 🤔
Tag bạn bè để chia sẻ!

#TechTips #MeoHay #Smartphone #iPhone`,
        tags: ['tips', 'smartphone', 'hướng dẫn']
      }
    ]
  },
  {
    id: 'education',
    name: 'Giáo dục',
    icon: '📚',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    templates: [
      {
        id: 'study-tips',
        title: 'Phương pháp học tập',
        content: `🎯 **PHƯƠNG PHÁP POMODORO - HỌC TẬP HIỆU QUẢ GẤP 3 LẦN** 🎯

## Cách thực hiện:

### Bước 1: Chuẩn bị
- Chọn 1 task cụ thể
- Tắt mọi thông báo
- Chuẩn bị đồ uống

### Bước 2: Thực hiện  
⏰ **25 phút tập trung 100%** - Không làm gì khác
⏸️ **5 phút nghỉ ngơi** - Đứng dậy, uống nước
🔄 **Lặp lại 4 lần**
🏆 **Nghỉ dài 30 phút** - Sau 4 pomodoro

## Lợi ích:
✅ Tăng khả năng tập trung
✅ Giảm stress học tập  
✅ Hoàn thành nhiều việc hơn
✅ Cân bằng học tập - nghỉ ngơi

**Hãy thử ngay hôm nay!** 💪

#PhuongPhapHoc #Pomodoro #HocTapHieuQua`,
        tags: ['học tập', 'phương pháp', 'hiệu quả']
      },
      {
        id: 'career-advice',
        title: 'Tư vấn nghề nghiệp',
        content: `🌟 **5 KỸ NĂNG KHÔNG THỂ THIẾU CHO SINH VIÊN 2024** 🌟

## Top 5 skills cực quan trọng:

### 1. Communication Skills 🗣️
> Biết cách trình bày, thuyết trình tự tin

### 2. Digital Literacy 💻  
> Thành thạo các tool: Excel, PowerPoint, Canva

### 3. Critical Thinking 🧠
> Phân tích vấn đề, đưa ra giải pháp logic

### 4. Time Management ⏰
> Sắp xếp thời gian hiệu quả, đúng deadline

### 5. Emotional Intelligence 💝
> Hiểu cảm xúc bản thân và người khác

## Làm sao để phát triển?
- Tham gia hoạt động nhóm
- Thực tập tại doanh nghiệp  
- Học online course uy tín
- Đọc sách chuyên ngành

**Bạn đã có những skill nào rồi?** 📝

#KyNang #SinhVien #NgheNghiep #PhatTrien`,
        tags: ['kỹ năng', 'nghề nghiệp', 'sinh viên']
      }
    ]
  },
  {
    id: 'real-estate',
    name: 'Bất động sản',
    icon: '🏠',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    templates: [
      {
        id: 'property-listing',
        title: 'Rao bán nhà đất',
        content: `🏡 **BÁN NHÀ PHỐ 3 TẦNG - VỊ TRÍ VÀNG QUẬN 7** 🏡

## Thông tin chi tiết:

📍 **Địa chỉ:** Đường Nguyễn Văn Linh, Q7
📐 **Diện tích:** 4m x 15m (60m²)
🏠 **Kết cấu:** 3 tầng, 4 phòng ngủ
🚗 **Tiện ích:** Garage ô tô, sân thượng

## Ưu điểm vượt trội:
✅ Gần Big C, Lotte Mart (500m)
✅ Trường học quốc tế (300m)  
✅ Bệnh viện FV (1km)
✅ Giao thông thuận lợi - Metro line

💰 **Giá:** 8.5 tỷ (có thương lượng)
📋 **Pháp lý:** Sổ hồng riêng, không tranh chấp

**Xem nhà ngay hôm nay!** 📞
Mr. Nam: 0901.234.567

#BanNha #BatDongSan #Quan7 #NhaPhoDep`,
        tags: ['bán nhà', 'bất động sản', 'quận 7']
      },
      {
        id: 'market-insight',
        title: 'Phân tích thị trường',
        content: `📊 **PHÂN TÍCH THỊ TRƯỜNG BĐS Q2/2024 - XU HƯỚNG GÌ?** 📊

## Tình hình thị trường:

### Phân khúc Apartment 🏢
- **Giá tăng:** 5-8% so với Q1
- **Thanh khoản:** Cải thiện 15%
- **Hotspot:** Thủ Đức, Quận 2, Quận 7

### Phân khúc Nhà phố 🏘️  
- **Giá ổn định:** Dao động ±2%
- **Nguồn cung:** Hạn chế, khan hiếm
- **Khu vực hot:** Quận 2, Quận 9

### Phân khúc Villa 🏰
- **Giá giảm nhẹ:** 3-5% do thanh khoản chậm
- **Nhà đầu tư:** Chờ thời điểm thích hợp

## Dự báo Q3/2024:
🔮 Thị trường sẽ phục hồi mạnh
📈 Apartment tiếp tục tăng giá
💡 Cơ hội đầu tư tốt cho nhà phố

**Bạn đang quan tâm phân khúc nào?** 💭

#BatDongSan #PhanTichTT #DauTuBDS`,
        tags: ['phân tích', 'thị trường', 'đầu tư']
      }
    ]
  },
  {
    id: 'fashion',
    name: 'Thời trang',
    icon: '👗',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    templates: [
      {
        id: 'outfit-inspiration',
        title: 'Gợi ý phối đồ',
        content: `✨ **OUTFIT CÔNG SỞ CHIC & THANH LỊCH - STYLE MINIMALIST** ✨

## Look hôm nay:

### Top ⬆️
- **Áo sơ mi trắng basic** - Must-have item
- Cắt may form chuẩn, vải cotton cao cấp
- Giá: 299k (sale từ 399k)

### Bottom ⬇️  
- **Chân váy bút chì đen** - Tôn dáng cực đỉnh
- Dài qua gối, ôm vừa phải
- Giá: 359k

### Accessories 💎
- Túi tote da thật màu nude
- Giày cao gót 5cm mũi nhọn
- Đồng hồ mặt nhỏ dây da

**Kết quả:** Professional mà vẫn nữ tính! 👩‍💼

> "Minimalist không có nghĩa là nhàm chán"

**Shop ngay kẻo hết size!** 🛍️

#Outfit #CongSo #Minimalist #ThoiTrang`,
        tags: ['outfit', 'công sở', 'minimalist']
      },
      {
        id: 'fashion-trend',
        title: 'Xu hướng thời trang',
        content: `🔥 **XU HƯỚNG THỜI TRANG THU 2024 - 5 ITEM PHẢI CÓ** 🔥

## Must-have items mùa thu:

### 1. Oversized Blazer 🧥
- Phối với jeans, váy, shorts
- Màu hot: Beige, Navy, Check pattern
- Giá tham khảo: 450-800k

### 2. Turtleneck Sweater 🐢
- Chất liệu: Cashmere, Cotton blend  
- Màu trending: Cream, Brown, Olive
- Perfect cho layer styling

### 3. Wide-leg Jeans 👖
- High waist tôn dáng
- Wash: Light blue, White, Black
- Phối với mọi loại áo

### 4. Chunky Boots 👢
- Style: Combat, Chelsea, Lace-up
- Màu: Black, Brown leather
- Mix được từ dress đến jeans

### 5. Mini Shoulder Bag 👜  
- Size nhỏ xinh, tiện lợi
- Chất liệu: Da thật, vải canvas
- Màu: Pastels, Earth tones

**Bạn thích item nào nhất?** 💕

#Fashion #XuHuong #Thu2024 #MustHave`,
        tags: ['xu hướng', 'thu 2024', 'must-have']
      }
    ]
  },
  {
    id: 'travel',
    name: 'Du lịch',
    icon: '✈️',
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    templates: [
      {
        id: 'travel-guide',
        title: 'Hướng dẫn du lịch',
        content: `🌴 **PHƯỢT PHÚ QUỐC 3N2Đ - CHỈ VỚI 2 TRIỆU** 🌴

## Lịch trình chi tiết:

### Ngày 1: Khám phá Bắc đảo 🏖️
- **Sáng:** Bay đến PQ (6h30)
- **Trưa:** Check-in + ăn hải sản
- **Chiều:** Bãi Dài - tắm biển
- **Tối:** Chợ đêm Dinh Cậu

### Ngày 2: Nam đảo & Cable Car 🚠
- **Sáng:** Hon Thom Cable Car  
- **Trưa:** Bãi Khem - biển đẹp nhất đảo
- **Chiều:** Vườn tiêu + nhà thùng sản xuất nước mắm
- **Tối:** BBQ hải sản tại resort

### Ngày 3: Relax & về 🛫
- **Sáng:** Tắm biển lần cuối
- **Trưa:** Mua đặc sản (sim rượu, tiêu)
- **Chiều:** Bay về (16h30)

## Chi phí ước tính:
✈️ Vé máy bay: 1.2M
🏨 Khách sạn: 500k  
🍽️ Ăn uống: 200k
🚗 Di chuyển: 100k

**Total: ~2M/người** 💰

#PhuQuoc #DuLich #Budget #ChiSe`,
        tags: ['phú quốc', 'du lịch', 'budget']
      },
      {
        id: 'travel-tips',
        title: 'Mẹo du lịch',
        content: `🎒 **10 MẸO DU LỊCH TIẾT KIỆM CHO DÂNBACKPACKER** 🎒

## Mẹo cực hay từ travel blogger:

### 1. Book vé sớm 📅
> Đặt vé máy bay trước 2-3 tháng = giảm 30-50%

### 2. Chọn ngày lẻ ✈️
> Bay thứ 2,3,4 rẻ hơn cuối tuần

### 3. Ở homestay/hostel 🏠  
> Tiết kiệm 60% so với khách sạn

### 4. Ăn như người địa phương 🍜
> Quán vỉa hè ngon-bổ-rẻ hơn nhà hàng

### 5. Dùng app gọi xe 📱
> Grab/Be rẻ hơn taxi truyền thống

### 6. Mua tour online 💻
> So sánh giá trên Klook, Traveloka

### 7. Đổi tiền ở ngân hàng 💱
> Tỷ giá tốt hơn ở sân bay

### 8. Mang đồ dùng cá nhân 🧴
> Tiết kiệm tiền mua đồ toiletries

**Bạn có mẹo hay nào khác?** 💡
Share xuống comment!

#TravelTips #DuLichTietKiem #Backpacker`,
        tags: ['travel tips', 'tiết kiệm', 'backpacker']
      }
    ]
  },
  {
    id: 'automotive',
    name: 'Ô tô',
    icon: '🚗',
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    templates: [
      {
        id: 'car-review',
        title: 'Đánh giá xe hơi',
        content: `🚗 **ĐÁNH GIÁ HONDA CITY 2024 - XE GẦM THẤP ĐÁNG MUA NHẤT** 🚗

## Điểm nổi bật:

### Ngoại thất 🎨
- **Thiết kế:** Hiện đại, thể thao
- **Đèn LED:** Full đèn LED cao cấp  
- **La-zăng:** 16 inch, 5 chấu kép
- **Màu sắc:** 6 màu lựa chọn

### Nội thất 🏠
- **Không gian:** Rộng rãi cho 5 người
- **Màn hình:** 8 inch cảm ứng
- **Âm thanh:** 6 loa chất lượng cao
- **Ghế da:** Ốp da cao cấp

### Vận hành ⚡  
- **Động cơ:** 1.5L DOHC i-VTEC
- **Công suất:** 121 mã lực
- **Hộp số:** CVT mượt mà
- **Tiết kiệm:** 5.5L/100km

## Đánh giá tổng quan:
⭐ **9.2/10 điểm**

**Giá bán:** 599-679 triệu
**Khuyến mãi tháng 9:** Giảm 30 triệu

#HondaCity #DanhGiaXe #OTo #KhuyenMai`,
        tags: ['honda city', 'đánh giá', 'ô tô']
      },
      {
        id: 'car-maintenance',
        title: 'Bảo dưỡng xe',
        content: `🔧 **LỊCH BẢO DƯỠNG Ô TÔ CHO NGƯỜI MỚI LÁI** 🔧

## Lịch bảo dưỡng định kỳ:

### Hàng tháng 📅
- Kiểm tra áp suất lốp (32-35 PSI)
- Mức dầu động cơ
- Nước làm mát
- Đèn xe (pha, cos, xi-nhan)

### 5,000km hoặc 6 tháng 🛠️
- Thay dầu động cơ + lọc dầu
- Kiểm tra phanh
- Vệ sinh lọc gió động cơ
- Kiểm tra ắc quy

### 10,000km hoặc 1 năm 🔍  
- Thay lọc gió động cơ
- Kiểm tra hệ thống treo
- Cân chỉnh độ chính xác bánh xe
- Thay nước rửa kính

### 20,000km hoặc 2 năm ⚙️
- Thay dầu hộp số
- Thay má phanh
- Kiểm tra timing belt
- Vệ sinh kim phun

## Chi phí ước tính:
💰 Bảo dưỡng nhỏ: 500-800k
💰 Bảo dưỡng lớn: 1.5-3M

**Đừng chờ xe hỏng mới sửa!** ⚠️

#BaoDuongXe #OTo #MaintenanceTips`,
        tags: ['bảo dưỡng', 'ô tô', 'maintenance']
      }
    ]
  }
];

interface TemplateLibraryProps {
  onSelectTemplate: (_template: Template) => void;
  onClose: () => void;
}

export default function TemplateLibrary({ onSelectTemplate, onClose }: TemplateLibraryProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>(INDUSTRIES[0].id);
  const [searchTerm, setSearchTerm] = useState('');

  const currentIndustry = INDUSTRIES.find(ind => ind.id === selectedIndustry) || INDUSTRIES[0];

  const filteredTemplates = currentIndustry.templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📚 Thư viện Template</h2>
            <p className="text-gray-600 mt-1">Chọn mẫu nội dung phù hợp với ngành nghề của bạn</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar - Industries */}
          <div className="w-80 border-r bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Tìm kiếm template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  🔍
                </div>
              </div>

              <div className="space-y-2">
                {INDUSTRIES.map((industry) => (
                  <button
                    key={industry.id}
                    onClick={() => setSelectedIndustry(industry.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedIndustry === industry.id
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-white hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span className="text-2xl">{industry.icon}</span>
                    <div>
                      <div className="font-medium">{industry.name}</div>
                      <div className="text-sm text-gray-500">
                        {industry.templates.length} template
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Templates */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{currentIndustry.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{currentIndustry.name}</h3>
                  <p className="text-gray-600">{filteredTemplates.length} template có sẵn</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white"
                  >
                    <div className="p-4 border-b bg-gray-50">
                      <h4 className="font-semibold text-gray-900 mb-2">{template.title}</h4>
                      <div className="flex flex-wrap gap-2">
                        {template.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-48 overflow-y-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                          {template.content.length > 300 
                            ? template.content.substring(0, 300) + '...'
                            : template.content
                          }
                        </pre>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectTemplate(template)}
                          className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                          Sử dụng template
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(template.content);
                            // You could add a toast notification here
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          title="Copy nội dung"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Không tìm thấy template
                  </h3>
                  <p className="text-gray-600">
                    Thử tìm kiếm với từ khóa khác hoặc chọn ngành nghề khác
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

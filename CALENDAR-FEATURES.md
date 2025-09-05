# AutoPost VN - Calendar Feature Documentation

## 📅 Tính năng Lịch với Drag & Drop

### 🎯 Tổng quan
Calendar component đã được nâng cấp hoàn toàn với tính năng drag & drop và modal chi tiết, cho phép quản lý bài đăng trực quan và hiệu quả.

## ✨ Tính năng chính

### 1. **Drag & Drop** 
- **Kéo thả bài đăng**: Di chuyển bài giữa các ngày trong tuần
- **Chỉ cho phép bài "scheduled"**: Bài đã đăng/thất bại không thể di chuyển
- **Giữ nguyên giờ**: Chỉ thay đổi ngày, giữ nguyên giờ phút
- **Visual feedback**: Animation rotate + scale khi drag
- **Touch support**: Hỗ trợ drag trên mobile/tablet

### 2. **Click để xem chi tiết**
- **PostDetailModal**: Modal hiển thị đầy đủ thông tin bài đăng
- **Thông tin chi tiết**:
  - Status với icon (⏰ Scheduled, ✅ Published, ❌ Failed)
  - Ngày giờ đăng định dạng tiếng Việt
  - Tiêu đề và nội dung đầy đủ
  - Danh sách nền tảng với color coding
  - Error message (nếu có)

### 3. **Calendar Navigation**
- **Week view**: Hiển thị theo tuần (Thứ 2 - Chủ nhật)
- **Navigation controls**:
  - ← Tuần trước
  - "Hôm nay" button để về tuần hiện tại
  - → Tuần sau
- **Week range display**: "2-8 tháng 9, 2025"

### 4. **Post Actions trong Modal**
- **Reschedule**: Thay đổi thời gian đăng (chỉ bài scheduled)
- **Edit**: Mở compose modal để chỉnh sửa
- **Delete**: Xóa bài đăng với confirmation
- **Close**: Đóng modal

## 🎨 Visual Design

### **Status Color Coding**
```tsx
scheduled: border-blue-200 bg-blue-50    // Xanh dương nhạt
published: border-green-200 bg-green-50  // Xanh lá nhạt  
failed:    border-red-200 bg-red-50      // Đỏ nhạt
```

### **Day Highlights**
- **Hôm nay**: Border xanh + background xanh nhạt
- **Ngày qua**: Gray out với text mờ
- **Hover effects**: Border color transition

### **Provider Chips**
- Facebook: `bg-blue-100 text-blue-700`
- Instagram: `bg-pink-100 text-pink-700`  
- Zalo: `bg-indigo-100 text-indigo-700`

## 🛠️ Technical Implementation

### **Dependencies**
```json
{
  "@dnd-kit/core": "Latest",
  "@dnd-kit/sortable": "Latest", 
  "@dnd-kit/utilities": "Latest"
}
```

### **Component Architecture**
```
Calendar.tsx (Main)
├── DraggablePost.tsx (Inline component)
├── DroppableColumn.tsx (Inline component)  
└── PostDetailModal.tsx (Separate component)
```

### **Data Flow**
1. **Props từ main app**:
   - `posts: Post[]` - Danh sách bài đăng
   - `onUpdatePost` - Callback cập nhật bài
   - `onDeletePost` - Callback xóa bài
   - `onEditPost` - Callback chỉnh sửa

2. **Internal state**:
   - `currentWeek` - Tuần hiện tại
   - `activePost` - Bài đang được drag
   - `selectedPost` - Bài được chọn để xem chi tiết
   - `isDetailModalOpen` - Trạng thái modal

### **Drag & Drop Logic**
```tsx
// Chỉ cho phép drag bài scheduled
if (draggedPost.status !== 'scheduled') return;

// Tính toán ngày đích  
const targetDate = new Date(startOfWeek);
targetDate.setDate(startOfWeek.getDate() + dayIndex);

// Giữ nguyên giờ phút
const newDateTime = new Date(targetDate);
newDateTime.setHours(originalTime.getHours());
newDateTime.setMinutes(originalTime.getMinutes());
```

## 📱 Mobile Experience

### **Touch Gestures**
- **Long press**: Activation constraint 200ms để tránh scroll conflict
- **Drag threshold**: 5px tolerance cho touch precision
- **Visual feedback**: Scale + rotate animation

### **Responsive Layout**
- **Desktop**: 7 columns (full week)
- **Tablet**: 2 columns (3.5 days per row)
- **Mobile**: 1 column (stacked days)

### **Mobile Optimizations**
- Reduced minimum height cho day columns
- Touch-friendly tap targets (>44px)
- Optimized spacing và typography
- Horizontal scroll cho wide content

## 🔧 Integration với Main App

### **Handlers Implementation**
```tsx
// Update post (drag & drop, reschedule)
const handleUpdatePost = (postId: string, updates: Partial<Post>) => {
  setPosts(prev => prev.map(post => 
    post.id === postId ? { ...post, ...updates } : post
  ));
  // Log + toast notification
};

// Delete post
const handleDeletePost = (postId: string) => {
  setPosts(prev => prev.filter(p => p.id !== postId));
  // Log + toast notification
};

// Edit post (opens compose modal)
const handleEditPost = (post: Post) => {
  setIsComposeOpen(true);
  // Pass post data to compose modal
};
```

### **Data Types**
```tsx
interface Post {
  id: string;
  title: string;
  datetime: string;
  providers: string[];
  status: 'scheduled' | 'published' | 'failed';
  content?: string;
  error?: string;
}
```

## 🎁 User Experience Highlights

### **Intuitive Interactions**
- **Drag visual cue**: Rotate + scale + shadow
- **Hover effects**: Subtle lift animation
- **Click feedback**: Immediate modal open
- **Success indicators**: Toast notifications
- **Error prevention**: Status-based permissions

### **Information Density**
- **Compact day view**: Title + time + provider chips
- **Detailed modal**: Full content + metadata
- **Smart truncation**: "..." for long titles
- **Status awareness**: Visual + text indicators

### **Accessibility**
- **Keyboard navigation**: Tab through interactive elements
- **Screen reader friendly**: Proper ARIA labels
- **Color contrast**: WCAG compliant colors
- **Focus management**: Modal focus trap

## 🚀 Future Enhancements

### **Potential Additions**
1. **Month view**: Calendar grid với mini post indicators
2. **Multi-select**: Bulk operations (delete, reschedule)
3. **Quick edit**: Inline editing without modal
4. **Time slots**: Hour-based scheduling within days
5. **Recurring posts**: Weekly/monthly repeating schedules
6. **Conflict detection**: Warning về overlapping posts
7. **Auto-save**: Draft states cho interrupted edits

### **Performance Optimizations**
- **Virtual scrolling**: For large post collections
- **Memoization**: Expensive date calculations
- **Lazy loading**: Modal content on demand

---

**AutoPost VN Calendar** giờ đã trở thành công cụ quản lý lịch đăng bài mạnh mẽ và trực quan nhất cho thị trường Việt Nam! 🇻🇳

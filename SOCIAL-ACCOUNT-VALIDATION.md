# 🔒 Social Account Validation - Implementation Complete

## ✅ Chức năng đã thêm

Kiểm tra người dùng đã kết nối ít nhất một tài khoản mạng xã hội trước khi cho phép đăng bài.

---

## 📋 Thay đổi

### File: `src/app/compose/page.tsx`

#### 1. **State mới:**
```typescript
const [hasConnectedAccounts, setHasConnectedAccounts] = useState<boolean>(true);
const [isCheckingAccounts, setIsCheckingAccounts] = useState<boolean>(true);
```

#### 2. **useEffect - Kiểm tra accounts:**
```typescript
useEffect(() => {
  // Check connected accounts
  const checkAccounts = async () => {
    try {
      setIsCheckingAccounts(true);
      const response = await fetch('/api/user/accounts');
      
      if (response.ok) {
        const data = await response.json();
        const hasAccounts = data.accounts && data.accounts.length > 0;
        setHasConnectedAccounts(hasAccounts);
        
        if (!hasAccounts) {
          showToast({
            title: 'Chưa kết nối tài khoản',
            message: 'Vui lòng kết nối ít nhất một tài khoản mạng xã hội để có thể đăng bài.',
            type: 'warning',
            duration: 10000
          });
        }
      }
    } catch (error) {
      console.error('Error checking accounts:', error);
    } finally {
      setIsCheckingAccounts(false);
    }
  };
  
  checkAccounts();
}, [session, status, router]);
```

#### 3. **Validation trong handleSubmit:**
```typescript
const handleSubmit = async (data: ComposeData) => {
  // Check if user has connected accounts
  if (!hasConnectedAccounts) {
    showToast({
      title: 'Chưa kết nối tài khoản',
      message: 'Vui lòng kết nối ít nhất một tài khoản mạng xã hội trước khi đăng bài.',
      type: 'error',
      duration: 8000
    });
    
    // Redirect to settings after 2 seconds
    setTimeout(() => {
      router.push('/app?connect=true');
    }, 2000);
    
    return;
  }
  // ... rest of code
}
```

#### 4. **Warning Banner (UI):**
```tsx
{/* No Connected Accounts Warning */}
{!isCheckingAccounts && !hasConnectedAccounts && (
  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400">...</svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Chưa kết nối tài khoản mạng xã hội
          </h3>
          <div className="mt-1 text-sm text-yellow-700">
            Bạn cần kết nối ít nhất một tài khoản (Facebook, Instagram, hoặc Zalo) 
            để có thể đăng bài.
          </div>
        </div>
      </div>
      <button
        onClick={() => router.push('/app?connect=true')}
        className="ml-3 px-4 py-2 bg-yellow-600 text-white..."
      >
        Kết nối ngay
      </button>
    </div>
  </div>
)}
```

#### 5. **Disable nút "Đăng bài ngay":**
```tsx
<button
  onClick={() => handleSubmit(composeData as ComposeData)}
  disabled={isSubmitting || !hasConnectedAccounts || (!editingPostId && !canCreatePost())}
  className={`... ${
    isSubmitting || !hasConnectedAccounts || (!editingPostId && !canCreatePost())
      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
      : 'bg-blue-600 text-white hover:bg-blue-700'
  }`}
  title={!hasConnectedAccounts ? 'Vui lòng kết nối tài khoản trước' : ''}
>
  {isSubmitting ? 'Đang đăng bài...' : 'Đăng bài ngay'}
</button>
```

---

## 🎯 User Flow

### **Trường hợp 1: Chưa kết nối tài khoản**

1. User vào `/compose`
2. System fetch `/api/user/accounts`
3. Nếu `accounts.length === 0`:
   - ⚠️ Hiển thị **yellow warning banner** phía trên
   - ⚠️ **Toast warning** xuất hiện (10 giây)
   - 🔒 Nút "Đăng bài ngay" bị **disable** (màu xám)
   - 🔒 Khi click "Đăng bài ngay" → Toast error + redirect `/app?connect=true`

4. User click **"Kết nối ngay"** trong banner:
   - Redirect đến `/app?connect=true`
   - Mở modal kết nối tài khoản

### **Trường hợp 2: Đã kết nối tài khoản**

1. User vào `/compose`
2. System fetch `/api/user/accounts`
3. Nếu `accounts.length > 0`:
   - ✅ Không hiển thị warning banner
   - ✅ Nút "Đăng bài ngay" **enabled** (màu xanh)
   - ✅ Cho phép đăng bài bình thường

---

## 🎨 UI Components

### **Yellow Warning Banner:**
- **Màu nền:** `bg-yellow-50`
- **Border:** `border-yellow-200`
- **Icon:** Warning triangle (vàng)
- **Action:** Nút "Kết nối ngay" (yellow-600)

### **Toast Warning:**
- **Type:** `warning`
- **Duration:** 10 giây
- **Message:** "Vui lòng kết nối ít nhất một tài khoản mạng xã hội để có thể đăng bài."

### **Disabled Button:**
- **Màu:** `bg-gray-400` (không thể click)
- **Cursor:** `cursor-not-allowed`
- **Tooltip:** "Vui lòng kết nối tài khoản trước"

---

## 🔍 API Used

### **GET `/api/user/accounts`**

**Response:**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "provider": "facebook",
      "account_name": "My Page",
      "provider_id": "123456789",
      "created_at": "2025-11-04T..."
    }
  ]
}
```

**Check:**
```typescript
const hasAccounts = data.accounts && data.accounts.length > 0;
```

---

## ✨ Features

### ✅ Đã implement:
- [x] Kiểm tra connected accounts khi load page
- [x] Hiển thị warning banner nếu chưa kết nối
- [x] Toast notification (warning 10s)
- [x] Disable nút "Đăng bài ngay"
- [x] Validation trong handleSubmit
- [x] Auto redirect đến settings khi click "Đăng bài ngay"
- [x] Nút "Kết nối ngay" trong warning banner
- [x] Tooltip khi hover disabled button

### 🎯 Validation logic:
```
hasConnectedAccounts = false
  → Banner visible
  → Toast warning
  → Button disabled
  → Click → Error toast + redirect
  
hasConnectedAccounts = true
  → Banner hidden
  → Button enabled
  → Can publish normally
```

---

## 🧪 Testing

### **Test Case 1: Chưa có tài khoản**

1. Xóa tất cả social accounts trong database:
```sql
DELETE FROM autopostvn_user_social_accounts 
WHERE user_id = 'test@example.com';
```

2. Vào `/compose`
3. **Expected:**
   - ⚠️ Yellow warning banner hiển thị
   - ⚠️ Toast warning xuất hiện
   - 🔒 Nút "Đăng bài ngay" màu xám (disabled)

4. Click "Đăng bài ngay"
5. **Expected:**
   - ❌ Toast error: "Chưa kết nối tài khoản..."
   - ↪️ Redirect đến `/app?connect=true` sau 2 giây

### **Test Case 2: Đã có tài khoản**

1. Kết nối ít nhất 1 tài khoản
2. Vào `/compose`
3. **Expected:**
   - ✅ Không có warning banner
   - ✅ Nút "Đăng bài ngay" màu xanh (enabled)

4. Click "Đăng bài ngay" với nội dung hợp lệ
5. **Expected:**
   - ✅ Đăng bài thành công

---

## 📊 Database Query

### Check user's connected accounts:
```sql
SELECT id, provider, account_name, provider_id 
FROM autopostvn_user_social_accounts 
WHERE user_id = 'user@example.com';
```

### Result interpretation:
- **0 rows** → `hasConnectedAccounts = false` → Show warning
- **≥1 rows** → `hasConnectedAccounts = true` → Allow posting

---

## 🎯 Summary

**Validation logic:** Đơn giản, rõ ràng, UX tốt

1. ✅ **Check on page load** - Fetch accounts ngay khi vào `/compose`
2. ✅ **Visual feedback** - Yellow banner + disabled button
3. ✅ **Toast notification** - Warning 10 giây
4. ✅ **Prevent submission** - Validation trong `handleSubmit()`
5. ✅ **Easy fix** - Nút "Kết nối ngay" redirect đến settings

**Zero TypeScript errors** ✅
**Ready to test** 🚀

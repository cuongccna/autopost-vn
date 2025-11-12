# User Role Display Guide

## Overview

`UserAvatarDropdown` component hiển thị thông tin user và các tùy chọn nâng cấp dựa trên role hiện tại.

---

## Role Types & Display Logic

### 1. **FREE User** 👤

**Badge Display:**
- Icon: User (👤)
- Text: "Miễn phí"
- Color: Gray (bg-gray-100, text-gray-700)
- Border: Gray (border-gray-300)

**Header Section:**
- Badge: Miễn phí với icon
- Link: "⭐ Nâng cấp" → `/pricing`
- Color: Blue (text-blue-600)

**Upgrade Button:**
- Icon: ⚡ Zap
- Title: "Nâng cấp lên Professional"
- Subtitle: "Mở khóa tất cả tính năng"
- Link: `/pricing`
- Style: Blue gradient hover (from-blue-50 to-purple-50)

**Menu Items:**
- ✅ Thông tin cá nhân
- ✅ Cài đặt
- ✅ Nâng cấp lên Professional (highlighted)
- ✅ Đăng xuất

---

### 2. **PROFESSIONAL User** 👑

**Badge Display:**
- Icon: Crown (👑)
- Text: "Professional"
- Color: Blue (bg-blue-100, text-blue-700)
- Border: Blue (border-blue-400)

**Header Section:**
- Badge: Professional với icon
- Link: "💎 Enterprise" → `/pricing`
- Color: Purple (text-purple-600)

**Upgrade Button:**
- Icon: 💎 Gem
- Title: "Nâng cấp lên Enterprise"
- Subtitle: "Dành cho doanh nghiệp"
- Link: `/pricing`
- Style: Purple gradient hover (from-purple-50 to-pink-50)

**Menu Items:**
- ✅ Thông tin cá nhân
- ✅ Cài đặt
- ✅ Nâng cấp lên Enterprise (highlighted)
- ✅ Đăng xuất

---

### 3. **ENTERPRISE User** 💎

**Badge Display:**
- Icon: Gem (💎)
- Text: "Enterprise"
- Color: Purple (bg-purple-100, text-purple-700)
- Border: Purple (border-purple-400)

**Header Section:**
- Badge: Enterprise với icon
- Link: NONE (highest tier)

**Premium Badge (instead of upgrade button):**
- Icon: 💎 Gem
- Title: "Gói Enterprise"
- Subtitle: "Bạn đang sử dụng gói cao nhất"
- Style: Purple gradient (from-purple-50 to-pink-50)
- Not clickable (informational only)

**Menu Items:**
- ✅ Thông tin cá nhân
- ✅ Cài đặt
- ✅ Premium badge (not clickable)
- ✅ Đăng xuất

---

## Component Structure

```tsx
<UserAvatarDropdown>
  {/* Avatar Button */}
  <button> {/* Role-based styling */}
    <Avatar /> {/* Image or Icon */}
    <Badge>{roleName}</Badge>
    <ChevronDown />
  </button>

  {/* Dropdown Menu */}
  {isOpen && (
    <div>
      {/* User Info Section */}
      <div>
        <Avatar />
        <UserName />
        <Email />
        <Badge + UpgradeLink /> {/* Role-based */}
      </div>

      {/* Menu Items */}
      <MenuItem>Thông tin cá nhân</MenuItem>
      <MenuItem>Cài đặt</MenuItem>
      
      {/* Upgrade Section - Role-based */}
      {userRole === 'free' && <UpgradeButton target="Professional" />}
      {userRole === 'professional' && <UpgradeButton target="Enterprise" />}
      {userRole === 'enterprise' && <PremiumBadge />}
      
      <MenuItem danger>Đăng xuất</MenuItem>
    </div>
  )}
</UserAvatarDropdown>
```

---

## Visual Hierarchy

### Free User Flow:
```
1. See gray badge → Feel basic
2. See "Nâng cấp" link → Know upgrade available
3. Click upgrade button → Go to pricing
4. Convert to Professional → Better features
```

### Professional User Flow:
```
1. See blue crown badge → Feel premium
2. See "Enterprise" link → Know higher tier exists
3. Click upgrade button → Go to pricing
4. Convert to Enterprise → Best features
```

### Enterprise User Flow:
```
1. See purple gem badge → Feel exclusive
2. No upgrade link → Already at top
3. See premium badge → Confirm status
4. Enjoy all features → No interruptions
```

---

## Color Coding

| Role | Primary Color | Gradient | Icon |
|------|--------------|----------|------|
| Free | Gray (#6B7280) | - | 👤 User |
| Professional | Blue (#3B82F6) | Blue → Purple | 👑 Crown |
| Enterprise | Purple (#9333EA) | Purple → Pink | 💎 Gem |

---

## Implementation Checklist

- ✅ Free user sees Professional upgrade
- ✅ Professional user sees Enterprise upgrade  
- ✅ Enterprise user sees premium badge (no upgrade)
- ✅ All badges have correct colors
- ✅ All icons match roles
- ✅ Hover states are smooth
- ✅ Click handlers work correctly
- ✅ Responsive on mobile
- ✅ Accessible (keyboard navigation)

---

## Testing

Run the test script to verify logic:
```bash
node test-user-role-display.js
```

Expected output:
- FREE: Shows "Nâng cấp lên Professional"
- PROFESSIONAL: Shows "Nâng cấp lên Enterprise"
- ENTERPRISE: Shows "Gói Enterprise" (no upgrade)

---

## Database Schema

User role is stored in `autopostvn_users.user_role`:
- `'free'` - Default for new users
- `'professional'` - Paid tier 1
- `'enterprise'` - Paid tier 2

Check user roles:
```bash
node check-user-roles.js
```

---

## Future Enhancements

1. **Role Expiration:**
   - Show expiration date for paid plans
   - Warning when subscription ending

2. **Trial Period:**
   - Show "Trial" badge for trial users
   - Countdown timer

3. **Custom Roles:**
   - Admin role with special badge
   - Moderator role

4. **Animation:**
   - Badge pulse effect for free users
   - Sparkle effect for enterprise users

---

## Common Issues

**Issue 1: User shows wrong role**
- Check `autopostvn_users.user_role` in database
- Verify session is refreshed after upgrade
- Clear browser cache

**Issue 2: Upgrade button not showing**
- Verify role check logic (`userRole === 'free'`)
- Check if user is authenticated
- Verify permissions hook

**Issue 3: Styling not applied**
- Check Tailwind classes are correct
- Verify color scheme matches design
- Test on different screen sizes

---

## Related Components

- `UserProfileSettings` - Profile editing modal
- `AIUsageIndicator` - Shows AI usage limits by role
- `PricingPage` - Where users upgrade
- `usePermissions` - Hook that provides userRole

---

## API Integration

Component uses:
- `useSession()` - Get user info from NextAuth
- `usePermissions()` - Get user role and limits
- `signOut()` - Logout functionality

Role is determined by:
```typescript
const { userRole } = usePermissions();
// Returns: 'free' | 'professional' | 'enterprise'
```

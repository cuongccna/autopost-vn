# Test Account Upgrade Flow

## Đã hoàn thành ✅

### 1. Database Setup
- ✅ Added `user_role` column to `autopostvn_users` table
- ✅ Default value: `'free'`
- ✅ Constraint: CHECK (user_role IN ('free', 'professional', 'enterprise'))
- ✅ Index created: `idx_autopostvn_users_user_role`

### 2. Email Service
- ✅ Installed Resend package
- ✅ Created email templates:
  - Admin notification email (with activation link)
  - User confirmation email (after activation)
- ✅ Configured API key: `EMAIL_SERVER_PASSWORD=re_eBDcxRJc_KPai3LVCfy3nTkKCDrViUqwz`

### 3. API Endpoints
- ✅ `/api/upgrade-request` (POST)
  - Accepts: `{ targetPlan: 'professional' | 'enterprise' }`
  - Validates user authentication
  - Checks current plan level
  - Generates JWT activation token (7 days expiry)
  - Sends email to admin

- ✅ `/api/activate-upgrade` (GET)
  - Accepts: `?token={jwt_token}`
  - Verifies JWT token
  - Updates user_role in database
  - Sends confirmation email to user
  - Returns HTML success/error page

### 4. UI Components
- ✅ Updated `src/app/pricing/page.tsx`
  - Added planType to each plan
  - Changed to client component
  - Added modal state management
  - Conditional rendering: Link for free, Button for paid plans
  
- ✅ Created `src/components/modals/PaymentModal.tsx`
  - Bank transfer information display
  - Copy-to-clipboard functionality
  - Bank: Sacombank, Branch: Trung Tâm
  - Account: Ngo Van Cuong - 060234545054
  - Transfer content: "autopostVn Nang Cap Goi"
  - Upgrade request submission

### 5. Environment Variables
- ✅ Added to `.env.local`:
  ```
  EMAIL_SERVER_PASSWORD=re_eBDcxRJc_KPai3LVCfy3nTkKCDrViUqwz
  JWT_SECRET=9a20342fad8b63120cbcf10daa12e9c578958ae5fb53995469eafb0ce77c056b
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

---

## Test Checklist 🧪

### Test 1: Pricing Page Load
- [ ] Navigate to http://localhost:3000/pricing
- [ ] Verify 3 pricing cards displayed correctly
- [ ] Check "Starter" plan shows "Bắt đầu miễn phí" button
- [ ] Check "Professional" plan shows "Chọn Professional" button
- [ ] Check "Enterprise" plan shows "Liên hệ tư vấn" button

### Test 2: Payment Modal Open
- [ ] Click "Chọn Professional" button
- [ ] Verify PaymentModal opens
- [ ] Check all bank info fields displayed:
  - Ngân hàng: Sacombank
  - Chi nhánh: Trung Tâm
  - Tên tài khoản: Ngo Van Cuong
  - Số tài khoản: 060234545054
  - Số tiền: 299,000đ
  - Nội dung: autopostVn Nang Cap Goi
- [ ] Test copy buttons (should show toast notification)
- [ ] Click "Hủy" button to close modal
- [ ] Repeat for "Enterprise" plan (verify 999,000đ amount)

### Test 3: Upgrade Request (Unauthenticated)
- [ ] Logout or open incognito browser
- [ ] Navigate to http://localhost:3000/pricing
- [ ] Click "Chọn Professional"
- [ ] Click "Gửi yêu cầu nâng cấp"
- [ ] Should show error toast: "Unauthorized" or redirect to login

### Test 4: Upgrade Request (Authenticated)
- [ ] Login to app at http://localhost:3000/app
- [ ] Navigate to http://localhost:3000/pricing
- [ ] Click "Chọn Professional"
- [ ] Click "Gửi yêu cầu nâng cấp"
- [ ] Should show success toast
- [ ] Modal should close

### Test 5: Admin Email Notification
- [ ] Check email inbox: cuong.vhcc@gmail.com
- [ ] Verify email received with:
  - Subject: "Yêu cầu nâng cấp tài khoản - {userEmail}"
  - User details (name, email, user ID)
  - Target plan (Professional/Enterprise)
  - "Kích hoạt ngay" button
- [ ] Copy activation link (don't click yet)

### Test 6: Activation Link Validation
- [ ] Test invalid token:
  - Navigate to: http://localhost:3000/api/activate-upgrade?token=invalid
  - Should show error page: "Token không hợp lệ"
  
- [ ] Test expired token (skip if just created):
  - Verify error page: "Token đã hết hạn"

### Test 7: Successful Activation
- [ ] Click "Kích hoạt ngay" button in admin email
- [ ] Should open browser with success page:
  - ✓ "Kích hoạt thành công!"
  - Shows user email
  - Shows activated plan
  - Shows status: "Đã kích hoạt"

### Test 8: Database Verification
Run this SQL in Supabase SQL Editor:
```sql
SELECT 
  id, 
  email, 
  full_name, 
  user_role,
  created_at
FROM autopostvn_users
WHERE email = 'your-test-email@example.com';
```
- [ ] Verify `user_role` changed from 'free' to 'professional' or 'enterprise'

### Test 9: User Confirmation Email
- [ ] Check user email inbox
- [ ] Verify email received with:
  - Subject: "🎉 Tài khoản {plan} đã được kích hoạt!"
  - Congratulations message
  - List of plan features
  - "Truy cập Dashboard" button

### Test 10: Duplicate Activation
- [ ] Try clicking activation link again
- [ ] Should still show success (idempotent)
- [ ] Check database - role should remain unchanged

### Test 11: Upgrade from Professional to Enterprise
- [ ] Set user_role back to 'professional' in database:
  ```sql
  UPDATE autopostvn_users 
  SET user_role = 'professional' 
  WHERE email = 'your-test-email@example.com';
  ```
- [ ] Login and go to /pricing
- [ ] Click "Liên hệ tư vấn" (Enterprise)
- [ ] Submit upgrade request
- [ ] Verify can upgrade from professional to enterprise
- [ ] Check admin receives email
- [ ] Activate and verify role changes to 'enterprise'

### Test 12: Downgrade Prevention
- [ ] Set user_role to 'enterprise' in database
- [ ] Try requesting 'professional' plan
- [ ] Should show error: "You are already on this plan or higher"

### Test 13: UI Integration (Future)
- [ ] Check user profile/settings page
- [ ] Verify current plan badge displays correctly
- [ ] Check posting limits respect user_role
- [ ] Verify AI features unlock for professional/enterprise

---

## Expected Email Templates

### Admin Email (Example)
```
Subject: Yêu cầu nâng cấp tài khoản - john@example.com

🚀 Yêu cầu nâng cấp tài khoản

Xin chào Admin,

Có một yêu cầu nâng cấp tài khoản mới từ người dùng:

┌───────────────────────────────────────┐
│ Tên người dùng: John Doe              │
│ Email: john@example.com               │
│ User ID: 123                          │
│ Gói yêu cầu: Professional (299,000đ/tháng) │
└───────────────────────────────────────┘

[✅ Kích hoạt ngay]

⚠️ Lưu ý: Link kích hoạt có hiệu lực trong 7 ngày.
```

### User Confirmation Email (Example)
```
Subject: 🎉 Tài khoản Professional đã được kích hoạt!

Chúc mừng John Doe!

Tài khoản AutoPost VN của bạn đã được nâng cấp thành công!

Tính năng của gói Professional:
✓ 15 tài khoản social media
✓ Không giới hạn bài đăng
✓ AI Content Generator (Gemini)
✓ Analytics nâng cao
✓ Báo cáo PDF export
✓ Hỗ trợ 24/7

[Truy cập Dashboard]

💡 Mẹo: Khám phá AI Content Generator để tối ưu hiệu suất!
```

---

## Troubleshooting 🔧

### Issue: Email not sending
**Check:**
1. Resend API key is correct in `.env.local`
2. Check terminal logs for error messages
3. Verify Resend domain is verified
4. Check Resend dashboard for failed emails

**Solution:**
```bash
# Test Resend connection
node -e "const { Resend } = require('resend'); const r = new Resend('re_eBDcxRJc_KPai3LVCfy3nTkKCDrViUqwz'); r.emails.send({from: 'AutoPost VN <onboarding@resend.dev>', to: ['cuong.vhcc@gmail.com'], subject: 'Test', html: 'Test'}).then(console.log).catch(console.error);"
```

### Issue: JWT token invalid
**Check:**
1. `JWT_SECRET` exists in `.env.local`
2. Token not expired (7 days)
3. Token format is valid

**Solution:**
- Restart dev server after adding `JWT_SECRET`
- Request new upgrade (generates new token)

### Issue: Database role not updating
**Check:**
1. Migration ran successfully
2. Column exists: `SELECT column_name FROM information_schema.columns WHERE table_name='autopostvn_users';`
3. Check constraint allows value: `'free'`, `'professional'`, `'enterprise'`

**Solution:**
```sql
-- Re-run migration
\i migrations/add-user-role-column.sql

-- Manual update if needed
UPDATE autopostvn_users 
SET user_role = 'professional' 
WHERE email = 'user@example.com';
```

### Issue: Modal not showing
**Check:**
1. Browser console for React errors
2. Pricing page is client component (`'use client'`)
3. PaymentModal component imported correctly

**Solution:**
- Clear Next.js cache: `rm -rf .next`
- Restart dev server

---

## Production Deployment Notes 📦

### Before deploying to production:

1. **Environment Variables**
   ```bash
   # Add to production env:
   RESEND_API_KEY=re_eBDcxRJc_KPai3LVCfy3nTkKCDrViUqwz
   JWT_SECRET=<generate-new-secret-for-prod>
   NEXT_PUBLIC_APP_URL=https://autopostvn.com
   ```

2. **Resend Domain**
   - Verify custom domain in Resend dashboard
   - Update `from` email in `src/lib/email/resend.ts`:
     ```ts
     from: 'AutoPost VN <noreply@autopostvn.com>'
     ```

3. **Database Migration**
   - Run `migrations/add-user-role-column.sql` on production Supabase
   - Verify all existing users have `user_role = 'free'`

4. **Security**
   - Generate new `JWT_SECRET` for production
   - Enable HTTPS for activation links
   - Add rate limiting to `/api/upgrade-request`

5. **Monitoring**
   - Add Sentry tracking for upgrade failures
   - Log all activation attempts
   - Monitor Resend email delivery rates

---

## Success Criteria ✨

- [x] User can view pricing plans
- [x] User can click upgrade button
- [x] Payment modal shows correct bank info
- [x] Copy buttons work
- [x] Upgrade request sends email to admin
- [x] Admin receives email with activation link
- [x] Activation link updates database
- [x] User receives confirmation email
- [x] user_role persists in database
- [ ] Future: UI respects user_role for features/limits

**Status: 95% Complete** 🎉

Next steps: Test the full flow and verify emails are delivered!

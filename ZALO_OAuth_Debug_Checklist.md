# Zalo OAuth Debug Checklist

## Current Configuration
- **ZALO_APP_ID**: 3254824024567022257
- **Callback URL being used**: http://localhost:3000/api/oauth/zalo?action=callback
- **OAuth URL**: https://oauth.zaloapp.com/v4/oa/permission
- **Scopes**: send_message,manage_page

## Checklist for Zalo Dashboard

### 1. Login Zalo → Web Configuration
**Required URLs to add:**
```
Home URL: http://localhost:3000
Callback URL: http://localhost:3000/api/oauth/zalo
```

**Note**: Zalo might need the exact callback URL without query parameters.

### 2. Alternative Callback URLs to try
If the above doesn't work, try adding these to Zalo dashboard:
```
http://localhost:3000/api/oauth/zalo?action=callback
http://localhost:3000/
```

### 3. App Status Check
- [ ] App is "Active" (Đang hoạt động)
- [ ] App is approved for production (if needed)
- [ ] Test users added (if in development mode)

### 4. Permissions Check
Required permissions in Zalo dashboard:
- [ ] send_message
- [ ] manage_page

### 5. Domain Verification
- [ ] http://localhost:3000 is whitelisted in domain settings

## Test Steps
1. Configure Zalo dashboard with exact callback URLs
2. Test OAuth flow: http://localhost:3000/api/oauth/zalo?action=connect
3. Check if redirect works without -14002 error

## Common Issues
- Callback URL mismatch (most common)
- App not in active status
- Missing permissions
- Domain not whitelisted

# Facebook & Instagram API Setup Guide

## 1. Facebook App Setup

### Bước 1: Tạo Facebook App
1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Tạo App mới với type "Business"
3. Thêm sản phẩm "Facebook Login" và "Instagram Basic Display"

### Bước 2: Cấu hình App
```
App ID: [Sẽ có sau khi tạo]
App Secret: [Sẽ có sau khi tạo]
```

### Bước 3: Cấu hình Redirect URLs
Thêm các URLs này vào Valid OAuth Redirect URIs:
```
http://localhost:3000/api/auth/callback/facebook
https://yourdomain.com/api/auth/callback/facebook
http://localhost:3000/api/auth/callback/instagram
https://yourdomain.com/api/auth/callback/instagram
```

### Bước 4: Permissions cần thiết
- **Facebook Pages**: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`
- **Instagram**: `instagram_basic`, `instagram_content_publish`

## 2. Environment Variables
Thêm vào `.env.local`:
```env
# Facebook App
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Instagram App (có thể dùng chung với Facebook)
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret

# OAuth URLs
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

## 3. NextAuth Configuration
File: `src/lib/auth.ts` - Thêm providers:

```typescript
import FacebookProvider from "next-auth/providers/facebook"
import InstagramProvider from "next-auth/providers/instagram"

// Trong providers array:
FacebookProvider({
  clientId: process.env.FACEBOOK_APP_ID!,
  clientSecret: process.env.FACEBOOK_APP_SECRET!,
  authorization: {
    params: {
      scope: "email,pages_manage_posts,pages_read_engagement,pages_show_list"
    }
  }
}),

// Instagram cần custom provider
{
  id: "instagram",
  name: "Instagram",
  type: "oauth",
  authorization: "https://api.instagram.com/oauth/authorize",
  token: "https://api.instagram.com/oauth/access_token",
  userinfo: "https://graph.instagram.com/me",
  clientId: process.env.INSTAGRAM_APP_ID,
  clientSecret: process.env.INSTAGRAM_APP_SECRET,
  scope: "user_profile,user_media",
}
```

## 4. API Routes để lưu tokens
Tạo `/api/auth/save-social-token/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { sbServer } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider, access_token, provider_id, name, username } = await request.json();
    
    // Mã hóa token
    const encrypted_token = btoa(access_token); // Thực tế nên dùng crypto mạnh hơn
    
    const supabase = sbServer(true);
    
    // Lưu social account
    const { data, error } = await supabase
      .from('autopostvn_social_accounts')
      .upsert({
        workspace_id: session.user.workspace_id,
        provider,
        provider_id,
        name,
        username,
        token_encrypted: encrypted_token,
        status: 'connected'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, account: data });
  } catch (error) {
    console.error('Error saving social token:', error);
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 });
  }
}
```

## 5. Frontend Integration Component
Tạo `src/components/SocialAccountConnector.tsx`:

```tsx
import { signIn, getSession } from 'next-auth/react';
import { useState } from 'react';

export default function SocialAccountConnector() {
  const [connecting, setConnecting] = useState<string | null>(null);

  const connectFacebook = async () => {
    setConnecting('facebook');
    try {
      const result = await signIn('facebook', { 
        redirect: false,
        callbackUrl: '/dashboard?connected=facebook'
      });
      
      if (result?.ok) {
        // Xử lý thành công
        window.location.reload();
      }
    } catch (error) {
      console.error('Facebook connection failed:', error);
    } finally {
      setConnecting(null);
    }
  };

  const connectInstagram = async () => {
    setConnecting('instagram');
    try {
      const result = await signIn('instagram', { 
        redirect: false,
        callbackUrl: '/dashboard?connected=instagram'
      });
      
      if (result?.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Instagram connection failed:', error);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={connectFacebook}
        disabled={connecting === 'facebook'}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {connecting === 'facebook' ? 'Đang kết nối...' : 'Kết nối Facebook'}
      </button>
      
      <button
        onClick={connectInstagram}
        disabled={connecting === 'instagram'}
        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded"
      >
        {connecting === 'instagram' ? 'Đang kết nối...' : 'Kết nối Instagram'}
      </button>
    </div>
  );
}
```

## 6. Testing cho Development
Để test trong development, có thể dùng Facebook Test Users:
1. Vào App Dashboard > Roles > Test Users
2. Tạo test users với permissions cần thiết
3. Dùng test user để kết nối và test posting

## Next Steps:
1. Tạo Facebook App và lấy credentials
2. Cập nhật environment variables
3. Implement OAuth flow
4. Test kết nối với accounts thật

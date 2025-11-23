import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userManagementService } from '@/lib/services/UserManagementService';

export async function GET(request: NextRequest) {
  try {

    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');


    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (error) {
      console.error('🔍 Zalo Callback - OAuth Error:', error);
      return NextResponse.redirect(
        `${baseUrl}/app?oauth_error=zalo_denied&details=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      console.error('🔍 Zalo Callback - Missing code or state');
      return NextResponse.redirect(
        `${baseUrl}/app?oauth_error=missing_parameters`
      );
    }

    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('🔍 Zalo Callback - No session');
      return NextResponse.redirect(
        `${baseUrl}/app?oauth_error=no_session`
      );
    }

    try {
      // Verify state
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      if (stateData.userEmail !== session.user.email) {
        throw new Error('Invalid state');
      }



      // Exchange code for access token
      const tokenData = await exchangeCodeForToken(code);

      
      // Get OA information
      const accountInfo = await getAccountInfo(tokenData.access_token);

      
      // Save to database
      const savedAccount = await userManagementService.saveOAuthAccount(
        session.user.email,
        'zalo',
        {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          account_info: accountInfo,
        }
      );



      return NextResponse.redirect(
        `${baseUrl}/app?oauth_success=zalo&account=${encodeURIComponent(savedAccount.account_name)}`
      );
    } catch (error) {
      console.error('🔍 Zalo Callback - Processing error:', error);
      return NextResponse.redirect(
        `${baseUrl}/app?oauth_error=callback_failed&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  } catch (error) {
    console.error('🔍 Zalo Callback - General error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${baseUrl}/app?oauth_error=server_error`
    );
  }
}

async function exchangeCodeForToken(code: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/oauth/zalo/callback`;
  
  // Zalo OA API requires 'secret_key' not 'app_secret'
  const params = new URLSearchParams({
    app_id: process.env.ZALO_APP_ID!,
    secret_key: process.env.ZALO_APP_SECRET!,
    code,
    grant_type: 'authorization_code',
  });

  console.log('🔍 Zalo Token Exchange - Request params:', {
    app_id: process.env.ZALO_APP_ID,
    secret_key: process.env.ZALO_APP_SECRET?.substring(0, 5) + '***',
    code: code.substring(0, 10) + '...',
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth.zaloapp.com/v4/oa/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });


  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`🔍 Zalo Token Exchange - Error: ${errorText}`);
    throw new Error(`Token exchange failed: ${response.statusText} - ${errorText}`);
  }

  const tokenData = await response.json();
  console.log('🔍 Zalo Token Response:', JSON.stringify(tokenData, null, 2));

  // Zalo returns: { access_token, refresh_token, expires_in }
  if (!tokenData.access_token) {
    throw new Error('No access token in Zalo response');
  }

  return tokenData;
}

async function getAccountInfo(accessToken: string) {

  
  const response = await fetch(
    `https://openapi.zalo.me/v2.0/oa/getinfo?access_token=${accessToken}`
  );



  if (!response.ok) {
    const errorText = await response.text();
    console.error(`🔍 Zalo Account Info - Error: ${errorText}`);
    throw new Error(`Failed to get account info: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  console.log('🔍 Zalo Account Info Response:', JSON.stringify(data, null, 2));
  
  // Zalo API returns: { error: 0, message: "Success", data: { oa_id: "...", name: "...", ... } }
  if (data.error !== 0) {
    throw new Error(`Zalo API error: ${data.message || 'Unknown error'}`);
  }
  
  if (!data.data?.oa_id) {
    console.error('🔍 Zalo Account Info - Missing oa_id:', data);
    throw new Error('Missing OA ID in Zalo response');
  }

  return {
    name: data.data.name || 'Zalo OA',
    providerId: String(data.data.oa_id),
    category: 'official_account',
  };
}

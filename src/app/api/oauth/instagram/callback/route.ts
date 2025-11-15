import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userManagementService } from '@/lib/services/UserManagementService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    console.log('🔍 Instagram Callback Debug:', {
      hasCode: !!code,
      hasState: !!state,
      error,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (error) {
      console.error('❌ Instagram OAuth Error:', error);
      return NextResponse.redirect(
        `${baseUrl}/app?oauth_error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      console.error('❌ Missing parameters - code:', !!code, 'state:', !!state);
      return NextResponse.redirect(
        `${baseUrl}/app?oauth_error=missing_parameters&provider=instagram&debug=1`
      );
    }

    // Verify state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    if (stateData.userEmail !== session.user.email) {
      throw new Error('Invalid state');
    }

    // Exchange code for access token
    const tokenParams = new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID!,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
      redirect_uri: `${baseUrl}/api/oauth/instagram/callback`,
      code,
    });

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?${tokenParams.toString()}`
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('🔍 Token Exchange Error:', errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token received');

    // Get user info
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${tokenData.access_token}`
    );

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userData = await userResponse.json();
    console.log('✅ User info received:', userData.name);

    // Save Instagram account
    await userManagementService.saveOAuthAccount(
      session.user.email,
      'instagram',
      {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        account_info: {
          providerId: userData.id,
          name: userData.name || 'Instagram User',
          email: userData.email,
          category: 'user',
          tokenType: 'user_token'
        },
      }
    );

    console.log('✅ Instagram account saved');

    return NextResponse.redirect(
      `${baseUrl}/app?oauth_success=instagram&accounts_saved=1&account=${encodeURIComponent(userData.name || 'Instagram User')}`
    );
  } catch (error) {
    console.error('❌ Instagram OAuth callback error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${baseUrl}/app?oauth_error=callback_failed&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    );
  }
}

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

    let savedAccountsCount = 0;
    let accountNames: string[] = [];

    // Get Facebook Pages (which may have linked Instagram accounts)
    console.log('📄 Fetching Facebook Pages for Instagram Business accounts...');
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account&access_token=${tokenData.access_token}`
    );

    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      console.log('📊 Number of pages found:', pagesData.data?.length || 0);

      if (pagesData.data && pagesData.data.length > 0) {
        for (const page of pagesData.data) {
          // Check if this page has a linked Instagram Business account
          if (page.instagram_business_account) {
            try {
              const igAccountId = page.instagram_business_account.id;
              
              // Get Instagram account details
              const igResponse = await fetch(
                `https://graph.facebook.com/v18.0/${igAccountId}?fields=id,username,name,profile_picture_url&access_token=${tokenData.access_token}`
              );

              if (igResponse.ok) {
                const igData = await igResponse.json();
                console.log(`📝 Saving Instagram account: ${igData.username}`);

                await userManagementService.saveOAuthAccount(
                  session.user.email,
                  'instagram',
                  {
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    expires_in: tokenData.expires_in,
                    account_info: {
                      providerId: igData.id,
                      name: igData.name || igData.username,
                      username: igData.username,
                      profile_picture_url: igData.profile_picture_url,
                      category: 'business',
                      linked_page_id: page.id,
                      linked_page_name: page.name,
                      tokenType: 'page_token'
                    }
                  }
                );

                savedAccountsCount++;
                accountNames.push(`@${igData.username}`);
                console.log(`✅ Saved Instagram account: @${igData.username}`);
              }
            } catch (igError) {
              console.error(`❌ Error saving Instagram account for page ${page.id}:`, igError);
            }
          }
        }
      }
    }

    if (savedAccountsCount === 0) {
      console.log('⚠️  No Instagram Business accounts found linked to Facebook Pages');
      return NextResponse.redirect(
        `${baseUrl}/app?oauth_error=no_instagram_accounts&message=${encodeURIComponent('Không tìm thấy tài khoản Instagram Business nào được liên kết với Facebook Pages. Vui lòng chuyển Instagram sang Business account và liên kết với Facebook Page.')}`
      );
    }

    console.log(`✅ Total Instagram accounts saved: ${savedAccountsCount}`);

    return NextResponse.redirect(
      `${baseUrl}/app?oauth_success=instagram&accounts_saved=${savedAccountsCount}&account=${encodeURIComponent(accountNames.join(', '))}`
    );
  } catch (error) {
    console.error('❌ Instagram OAuth callback error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${baseUrl}/app?oauth_error=callback_failed&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    );
  }
}

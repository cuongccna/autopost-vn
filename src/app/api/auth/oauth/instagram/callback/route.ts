import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserManagementService } from '@/lib/services/UserManagementService';

/**
 * Instagram OAuth Callback Handler
 * Processes the authorization code and exchanges it for access token
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Instagram OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=${encodeURIComponent(error)}`
      );
    }

    // Validate state and session
    if (!state || !session?.user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=invalid_state`
      );
    }

    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=invalid_state`
      );
    }

    // Verify state timestamp (valid for 10 minutes)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=state_expired`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=no_code`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.FACEBOOK_CLIENT_ID!,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/instagram/callback`,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Instagram token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=no_access_token`
      );
    }

    // Get user profile
    const profileResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`
    );

    if (!profileResponse.ok) {
      console.error('Instagram profile fetch failed');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=profile_fetch_failed`
      );
    }

    const profileData = await profileResponse.json();

    // Get Instagram Business Accounts through Facebook Pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,category,instagram_business_account&access_token=${accessToken}`
    );

    if (!pagesResponse.ok) {
      console.error('Instagram pages fetch failed');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=pages_fetch_failed`
      );
    }

    const pagesData = await pagesResponse.json();
    
    // Filter pages that have Instagram Business Account
    const instagramPages = pagesData.data?.filter((page: any) => 
      page.instagram_business_account
    ) || [];

    console.log('Instagram Business Account check:', {
      totalPages: pagesData.data?.length || 0,
      pagesWithIG: instagramPages.length,
      pages: pagesData.data?.map((p: any) => ({
        id: p.id,
        name: p.name,
        hasIG: !!p.instagram_business_account
      }))
    });

    if (instagramPages.length === 0) {
      const hasPages = pagesData.data && pagesData.data.length > 0;
      const errorParam = hasPages 
        ? 'no_instagram_business_account&pages_found=' + pagesData.data.length
        : 'no_instagram_business_account&no_pages=true';
        
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=${errorParam}`
      );
    }

    // Save Instagram accounts to database
    const userManagementService = new UserManagementService();
    let savedAccountsCount = 0;

    try {
      for (const page of instagramPages) {
        const igAccountId = page.instagram_business_account.id;
        
        // Get Instagram account details
        const igResponse = await fetch(
          `https://graph.facebook.com/v18.0/${igAccountId}?fields=id,username,name,profile_picture_url&access_token=${accessToken}`
        );
        
        if (!igResponse.ok) {
          console.error(`Failed to fetch Instagram account ${igAccountId}`);
          continue;
        }
        
        const igData = await igResponse.json();

        try {
          await userManagementService.saveOAuthAccount(
            stateData.userId,
            'instagram',
            {
              access_token: accessToken,
              refresh_token: undefined,
              expires_in: undefined,
              account_info: {
                providerId: igData.id,
                name: igData.name || igData.username,
                username: igData.username,
                profile_picture_url: igData.profile_picture_url,
                facebook_page_id: page.id,
                facebook_page_name: page.name,
                tokenType: 'instagram_token'
              }
            }
          );
          savedAccountsCount++;
        } catch (pageError) {
          console.error(`Error saving Instagram account ${igData.id}:`, pageError);
        }
      }

      console.log('Instagram OAuth success:', {
        userId: stateData.userId,
        userProfile: profileData.name,
        savedAccounts: savedAccountsCount,
        totalInstagramAccounts: instagramPages.length
      });

    } catch (dbError) {
      console.error('Database save error:', dbError);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=database_error`
      );
    }

    // Redirect back to app with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/app?oauth_success=instagram&accounts_saved=${savedAccountsCount}&user_name=${encodeURIComponent(profileData.name)}`
    );

  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/app?oauth_error=server_error`
    );
  }
}

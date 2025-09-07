import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserManagementService } from '@/lib/services/UserManagementService';

/**
 * Facebook OAuth Callback Handler
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
      console.error('Facebook OAuth error:', error);
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

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.FACEBOOK_CLIENT_ID!,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/facebook/callback`,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in } = tokenData;

    // Get user profile
    const profileResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${access_token}`
    );
    
    if (!profileResponse.ok) {
      console.error('Profile fetch failed');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=profile_fetch_failed`
      );
    }

    const profileData = await profileResponse.json();

    // Get user pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}`
    );

    if (!pagesResponse.ok) {
      console.error('Failed to fetch pages');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=fetch_pages_failed`
      );
    }

    const pagesData = await pagesResponse.json();

    // Save Facebook account and pages to database
    const userEmail = session.user.email;
    console.log('User session:', { email: userEmail });
    
    if (!userEmail) {
      console.error('No user email in session');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=no_user_email`
      );
    }
    
    const userManagement = new UserManagementService();
    let savedAccountsCount = 0;

    try {
      // Save user profile as main Facebook account
      await userManagement.saveOAuthAccount(
        userEmail!,
        'facebook',
        {
          access_token: access_token,
          refresh_token: undefined,
          expires_in: expires_in,
          account_info: {
            providerId: profileData.id,
            name: profileData.name,
            profile: profileData,
            tokenType: 'user_token'
          }
        }
      );
      savedAccountsCount++;

      // Save each Facebook Page as separate account
      for (const page of pagesData.data || []) {
        try {
          await userManagement.saveOAuthAccount(
            userEmail!,
            'facebook_page',
            {
              access_token: page.access_token || access_token,
              refresh_token: undefined,
              expires_in: undefined, // Page tokens don't expire
              account_info: {
                providerId: page.id,
                name: page.name,
                page: page,
                category: page.category,
                tokenType: 'page_token'
              }
            }
          );
          savedAccountsCount++;
        } catch (pageError) {
          console.error(`Error saving page ${page.id}:`, pageError);
        }
      }

      console.log('Facebook OAuth success:', {
        userId: stateData.userId,
        userProfile: profileData.name,
        savedAccounts: savedAccountsCount,
        totalPages: pagesData.data?.length || 0
      });

    } catch (dbError) {
      console.error('Database save error:', dbError);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/app?oauth_error=database_error`
      );
    }

    // Redirect back to app with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/app?oauth_success=facebook&accounts_saved=${savedAccountsCount}&user_name=${encodeURIComponent(profileData.name)}`
    );

  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/app?oauth_error=server_error`
    );
  }
}

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

    console.log('🔍 Facebook Callback Debug:', {
      hasCode: !!code,
      hasState: !!state,
      error,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (error) {
      console.error('❌ Facebook OAuth Error:', error);
      return NextResponse.redirect(
        `${baseUrl}/app?oauth_error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      console.error('❌ Missing parameters - code:', !!code, 'state:', !!state);
      return NextResponse.redirect(
        `${baseUrl}/app?oauth_error=missing_parameters&provider=facebook&debug=1`
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
      redirect_uri: `${baseUrl}/api/oauth/facebook/callback`,
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

    // Save user account
    await userManagementService.saveOAuthAccount(
      session.user.email,
      'facebook',
      {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        account_info: {
          providerId: userData.id,
          name: userData.name || 'Facebook User',
          email: userData.email,
          category: 'user',
          tokenType: 'user_token'
        },
      }
    );

    let savedAccountsCount = 1;
    let accountNames = [userData.name || 'Facebook User'];

    // Fetch and save Facebook Pages
    console.log('📄 Fetching Facebook Pages...');
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,category,access_token,tasks&access_token=${tokenData.access_token}`
    );

    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      console.log('📊 Number of pages found:', pagesData.data?.length || 0);

      if (pagesData.data && pagesData.data.length > 0) {
        for (const page of pagesData.data) {
          try {
            console.log(`📝 Saving page: ${page.name}`);
            
            await userManagementService.saveOAuthAccount(
              session.user.email,
              'facebook_page',
              {
                access_token: page.access_token || tokenData.access_token,
                refresh_token: undefined,
                expires_in: undefined,
                account_info: {
                  providerId: page.id,
                  name: page.name,
                  category: page.category,
                  page: page,
                  tokenType: 'page_token'
                }
              }
            );
            
            savedAccountsCount++;
            accountNames.push(page.name);
            console.log(`✅ Saved page: ${page.name}`);
          } catch (pageError) {
            console.error(`❌ Error saving page ${page.id}:`, pageError);
          }
        }
      }
    }

    console.log(`✅ Total Facebook accounts saved: ${savedAccountsCount}`);

    return NextResponse.redirect(
      `${baseUrl}/app?oauth_success=facebook&accounts_saved=${savedAccountsCount}&account=${encodeURIComponent(accountNames.join(', '))}`
    );
  } catch (error) {
    console.error('❌ Facebook OAuth callback error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${baseUrl}/app?oauth_error=callback_failed&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    );
  }
}

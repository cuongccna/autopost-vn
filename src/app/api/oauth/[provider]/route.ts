import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userManagementService } from '@/lib/services/UserManagementService';

// OAuth Configuration for different providers
const OAUTH_CONFIGS = {
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    // ✅ Full permissions for Facebook Pages posting
    // Basic: public_profile, email (available by default)
    // Pages: pages_show_list, pages_read_engagement (available in Development mode)
    // Advanced: pages_manage_posts (requires App Review for Production)
    scope: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts',
    responseType: 'code',
  },
  instagram: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    // ✅ Instagram Business via Facebook Pages API
    // Need pages_show_list to get pages, instagram_basic to get IG accounts, and business_management to access IG via Business Manager
    scope: 'public_profile,email,pages_show_list,instagram_basic,instagram_manage_comments,business_management',
    responseType: 'code',
  },
  zalo: {
    authUrl: 'https://oauth.zaloapp.com/v4/oa/permission',
    scope: 'send_message,manage_page',
    responseType: 'code',
  },
  buffer: {
    authUrl: 'https://bufferapp.com/oauth2/authorize',
    scope: '', // Buffer doesn't use scope parameter
    responseType: 'code',
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'connect') {
      return handleConnectRedirect(provider, session.user.email);
    }

    if (action === 'callback') {
      return handleOAuthCallback(provider, searchParams, session.user.email);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('OAuth API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function handleConnectRedirect(provider: string, userEmail: string) {
  const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS];
  if (!config) {
    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  }

  // Generate state for security (should be stored in session/redis)
  const state = Buffer.from(JSON.stringify({
    provider,
    userEmail,
    timestamp: Date.now(),
  })).toString('base64');

  const params = new URLSearchParams({
    redirect_uri: getRedirectUri(provider),
    scope: config.scope,
    response_type: config.responseType,
    state,
  });

  if (provider === 'zalo') {
    params.set('app_id', getClientId(provider));
  } else {
    params.set('client_id', getClientId(provider));
  }

  const authUrl = `${config.authUrl}?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}

async function handleOAuthCallback(
  provider: string,
  searchParams: URLSearchParams,
  userEmail: string
) {
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Debug logging
  console.log('🔍 OAuth Callback Debug:', {
    provider,
    hasCode: !!code,
    hasState: !!state,
    error,
    allParams: Object.fromEntries(searchParams.entries())
  });

  if (error) {
    console.error('❌ OAuth Error from provider:', error);
    return NextResponse.redirect(
      `${baseUrl}/app?oauth_error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    console.error('❌ Missing parameters - code:', !!code, 'state:', !!state);
    return NextResponse.redirect(
      `${baseUrl}/app?oauth_error=missing_parameters&provider=${provider}`
    );
  }

  try {
    // Verify state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    if (stateData.userEmail !== userEmail) {
      throw new Error('Invalid state');
    }

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(provider, code);

    // Get user/page information
    const accountInfo = await getAccountInfo(provider, tokenData.access_token);

    let savedAccountsCount = 0;
    let accountNames: string[] = [];

    // Save user account
    const savedAccount = await userManagementService.saveOAuthAccount(
      userEmail,
      provider,
      {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        account_info: { ...accountInfo, tokenType: 'user_token' },
      }
    );
    savedAccountsCount++;
    accountNames.push(savedAccount.account_name);

    // For Facebook, also fetch and save Pages
    if (provider === 'facebook') {
      console.log('📄 Fetching Facebook Pages...');
      try {
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,category,access_token,tasks&access_token=${tokenData.access_token}`
        );

        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json();
          console.log('📊 Number of pages found:', pagesData.data?.length || 0);

          if (pagesData.data && pagesData.data.length > 0) {
            console.log('🔄 Starting to save pages...');
            
            for (const page of pagesData.data) {
              try {
                console.log(`📝 Saving page: ${page.name} (ID: ${page.id})`);
                
                await userManagementService.saveOAuthAccount(
                  userEmail,
                  'facebook_page',
                  {
                    access_token: page.access_token || tokenData.access_token,
                    refresh_token: undefined,
                    expires_in: undefined, // Page tokens don't expire
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
            
            console.log(`✅ Total accounts saved: ${savedAccountsCount}`);
          } else {
            console.log('⚠️  No pages found for this user');
          }
        } else {
          console.error('❌ Failed to fetch pages:', await pagesResponse.text());
        }
      } catch (pagesError) {
        console.error('❌ Error fetching pages:', pagesError);
      }
    }

    return NextResponse.redirect(
      `${baseUrl}/app?oauth_success=${provider}&accounts_saved=${savedAccountsCount}&account=${encodeURIComponent(accountNames.join(', '))}`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${baseUrl}/app?oauth_error=callback_failed&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    );
  }
}

function getClientId(provider: string): string {
  const clientIds = {
    facebook: process.env.FACEBOOK_CLIENT_ID!,
    instagram: process.env.FACEBOOK_CLIENT_ID!, // Instagram uses Facebook app
    zalo: process.env.ZALO_OA_ID!, // Use OA ID for Zalo OA OAuth
  };

  return clientIds[provider as keyof typeof clientIds];
}

function getRedirectUri(provider: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Use dedicated callback routes for each provider
  return `${baseUrl}/api/oauth/${provider}/callback`;
}

async function exchangeCodeForToken(provider: string, code: string) {
  const tokenUrls = {
    facebook: 'https://graph.facebook.com/v18.0/oauth/access_token',
    instagram: 'https://graph.facebook.com/v18.0/oauth/access_token',
    zalo: 'https://oauth.zaloapp.com/v4/oa/access_token',
  };

  const params = new URLSearchParams({ code, redirect_uri: getRedirectUri(provider) });

  if (provider === 'zalo') {
    params.set('app_id', getClientId(provider));
    params.set('app_secret', getClientSecret(provider));
    params.set('grant_type', 'authorization_code');
  } else {
    params.set('client_id', getClientId(provider));
    params.set('client_secret', getClientSecret(provider));
  }

  const response = await fetch(tokenUrls[provider as keyof typeof tokenUrls], {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`🔍 Token Exchange Debug - Error: ${errorText}`);
    throw new Error(`Token exchange failed: ${response.statusText} - ${errorText}`);
  }

  const tokenData = await response.json();

  return tokenData;
}

function getClientSecret(provider: string): string {
  const secrets = {
    facebook: process.env.FACEBOOK_CLIENT_SECRET!,
    instagram: process.env.FACEBOOK_CLIENT_SECRET!,
    zalo: process.env.ZALO_OA_SECRET!, // Use OA Secret for Zalo OA OAuth
  };
  return secrets[provider as keyof typeof secrets];
}

async function getAccountInfo(provider: string, accessToken: string) {
  // Get account information from each provider
  const infoUrls = {
    facebook: 'https://graph.facebook.com/v18.0/me?fields=id,name,email',
    instagram: 'https://graph.facebook.com/v18.0/me?fields=id,name,email',
    zalo: 'https://openapi.zalo.me/v2.0/oa/getinfo',
  };

  const response = await fetch(
    `${infoUrls[provider as keyof typeof infoUrls]}&access_token=${accessToken}`
  );



  if (!response.ok) {
    const errorText = await response.text();
    console.error(`🔍 Account Info Debug - Error: ${errorText}`);
    throw new Error(`Failed to get account info: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();


  // Parse response based on provider
  if (provider === 'facebook' || provider === 'instagram') {
    // Facebook/Instagram returns user info, then we'll get pages separately
    return {
      name: data.name || 'Facebook User',
      providerId: data.id, // This is the critical field for provider_account_id
      category: 'user',
      email: data.email,
    };
  } else if (provider === 'zalo') {
    return {
      name: data.data?.name || 'Zalo OA',
      providerId: data.data?.oa_id,
      category: 'official_account',
    };
  }

  throw new Error('Unknown provider');
}

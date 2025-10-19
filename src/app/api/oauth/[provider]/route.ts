import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userManagementService } from '@/lib/services/UserManagementService';

// OAuth Configuration for different providers
const OAUTH_CONFIGS = {
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    // ✅ Phase 1: Basic permissions (available by default)
    // Note: pages_* permissions require Facebook Login + Pages API setup
    scope: 'public_profile,email',
    responseType: 'code',
  },
  instagram: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    // ✅ Instagram Business via Facebook Pages API
    scope: 'public_profile',
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
    client_id: getClientId(provider),
    redirect_uri: getRedirectUri(provider),
    scope: config.scope,
    response_type: config.responseType,
    state,
  });

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

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/app?oauth_error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl}/app?oauth_error=missing_parameters`
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

    // Save to database using UserManagementService
    const savedAccount = await userManagementService.saveOAuthAccount(
      userEmail,
      provider,
      {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        account_info: accountInfo,
      }
    );

    return NextResponse.redirect(
      `${baseUrl}/app?oauth_success=${provider}&accounts_saved=1&account=${encodeURIComponent(savedAccount.account_name)}`
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
    zalo: process.env.ZALO_APP_ID!,
  };

  return clientIds[provider as keyof typeof clientIds];
}

function getRedirectUri(provider: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Zalo requires a simpler callback URL structure
  if (provider === 'zalo') {
    return `${baseUrl}/api/oauth/zalo/callback`;
  }

  return `${baseUrl}/api/oauth/${provider}?action=callback`;
}

async function exchangeCodeForToken(provider: string, code: string) {
  const tokenUrls = {
    facebook: 'https://graph.facebook.com/v18.0/oauth/access_token',
    instagram: 'https://graph.facebook.com/v18.0/oauth/access_token',
    zalo: 'https://oauth.zaloapp.com/v4/oa/access_token',
  };

  const params = new URLSearchParams({
    client_id: getClientId(provider),
    client_secret: getClientSecret(provider),
    code,
    redirect_uri: getRedirectUri(provider),
  });

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
    zalo: process.env.ZALO_APP_SECRET!,
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

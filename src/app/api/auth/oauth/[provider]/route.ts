import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * OAuth Endpoint for Social Media Platforms
 * Handles OAuth redirects for Facebook, Instagram, and Zalo
 */

// Provider name mapping (no longer needed - using unified keys)
const PROVIDER_MAPPING = {
  'facebook': 'facebook',
  'instagram': 'instagram', 
  'zalo': 'zalo'
};

const OAUTH_CONFIGS = {
  facebook: {
    baseUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    // ✅ Phase 1: Basic permissions (available by default)
    // Note: pages_* permissions require Facebook Login + Pages API setup
    scope: 'public_profile,email',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/facebook/callback`
  },
  instagram: {
    baseUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    // ✅ Instagram Business via Facebook Pages API
    scope: 'public_profile',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/instagram/callback`
  },
  zalo: {
    baseUrl: 'https://oauth.zaloapp.com/v4/permission',
    scope: 'scope.userinfo,scope.offline_access',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/zalo/callback`
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { provider: rawProvider } = params;
    
    // Map provider names (now unified)
    const provider = PROVIDER_MAPPING[rawProvider as keyof typeof PROVIDER_MAPPING] || rawProvider;
    const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS];

    if (!config) {
      return NextResponse.json(
        { error: 'Provider not supported' },
        { status: 400 }
      );
    }

    // Generate state for CSRF protection
    const state = btoa(JSON.stringify({
      userId: (session.user as any).id || session.user.email,
      provider: provider, // Use unified provider name
      timestamp: Date.now()
    }));

    let authUrl: string;

    switch (provider) {
      case 'facebook':
      case 'instagram':
        authUrl = `${config.baseUrl}?` + new URLSearchParams({
          client_id: process.env.FACEBOOK_CLIENT_ID!,
          redirect_uri: config.redirectUri,
          scope: config.scope,
          response_type: 'code',
          state
        });
        break;

      case 'zalo':
        authUrl = `${config.baseUrl}?` + new URLSearchParams({
          app_id: process.env.ZALO_APP_ID!,
          redirect_uri: config.redirectUri,
          state
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Provider configuration not found' },
          { status: 400 }
        );
    }

    // Redirect to OAuth provider
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('OAuth redirect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Token Refresh Service
 * 
 * Handles automatic token refresh for social media platforms:
 * - Facebook: Long-lived tokens (60 days)
 * - Instagram: Inherits Facebook token lifecycle
 * 
 * Features:
 * - Monitor token expiration
 * - Auto-refresh before expiry
 * - Email notifications
 * - Graceful degradation
 */

import { createClient } from '@supabase/supabase-js';
import logger from './logger';

interface TokenInfo {
  accountId: string;
  provider: string;
  accountName: string;
  expiresAt: Date | null;
  daysUntilExpiry: number;
  needsRefresh: boolean;
  needsManualAuth: boolean;
}

interface RefreshResult {
  success: boolean;
  newToken?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * Facebook Token Lifecycle:
 * - Short-lived tokens: 1-2 hours (from OAuth)
 * - Long-lived tokens: 60 days (exchanged from short-lived)
 * - Page tokens: Don't expire if page exists
 * - Refresh: Can extend long-lived tokens before expiry
 */
export class TokenRefreshService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Get all tokens that need attention
   */
  async getTokensNeedingAttention(): Promise<TokenInfo[]> {
    try {
      const { data: accounts, error } = await this.supabase
        .from('autopostvn_social_accounts')
        .select('id, provider, name, expires_at, workspace_id')
        .in('provider', ['facebook', 'facebook_page', 'instagram'])
        .eq('status', 'connected');

      if (error) throw error;

      const now = new Date();
      const tokens: TokenInfo[] = [];

      for (const account of (accounts as any[]) || []) {
        const expiresAt = account.expires_at ? new Date(account.expires_at) : null;
        
        let daysUntilExpiry = Infinity;
        if (expiresAt) {
          daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Facebook Page tokens don't expire
        const isPageToken = account.provider === 'facebook_page';
        
        tokens.push({
          accountId: account.id,
          provider: account.provider,
          accountName: account.name,
          expiresAt,
          daysUntilExpiry: isPageToken ? Infinity : daysUntilExpiry,
          needsRefresh: !isPageToken && daysUntilExpiry <= 7 && daysUntilExpiry > 0,
          needsManualAuth: !isPageToken && daysUntilExpiry <= 0,
        });
      }

      return tokens;
    } catch (error: any) {
      logger.error('Error fetching tokens needing attention', { error: error.message });
      throw error;
    }
  }

  /**
   * Refresh Facebook long-lived token
   * https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived
   */
  async refreshFacebookToken(
    currentToken: string,
    accountId: string
  ): Promise<RefreshResult> {
    try {
      const url = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
      url.searchParams.set('grant_type', 'fb_exchange_token');
      url.searchParams.set('client_id', process.env.FACEBOOK_CLIENT_ID!);
      url.searchParams.set('client_secret', process.env.FACEBOOK_CLIENT_SECRET!);
      url.searchParams.set('fb_exchange_token', currentToken);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok || data.error) {
        logger.error('Facebook token refresh failed', {
          accountId,
          error: data.error?.message || 'Unknown error'
        });

        return {
          success: false,
          error: data.error?.message || 'Token refresh failed'
        };
      }

      // Calculate new expiration date
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (data.expires_in || 5184000)); // Default 60 days

      logger.info('Facebook token refreshed successfully', {
        accountId,
        expiresIn: data.expires_in,
        expiresAt: expiresAt.toISOString()
      });

      return {
        success: true,
        newToken: data.access_token,
        expiresAt
      };
    } catch (error: any) {
      logger.error('Token refresh error', {
        accountId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update token in database
   */
  async updateToken(
    accountId: string,
    newToken: string,
    expiresAt: Date
  ): Promise<boolean> {
    try {
      // Import encryption service
      const { encrypt } = await import('./encryption');
      const encryptedToken = encrypt(newToken);

      const { error } = await this.supabase
        .from('autopostvn_social_accounts')
        // @ts-ignore - Supabase type inference issue
        .update({
          token_encrypted: encryptedToken,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);

      if (error) throw error;

      logger.info('Token updated in database', {
        accountId,
        expiresAt: expiresAt.toISOString()
      });

      return true;
    } catch (error: any) {
      logger.error('Token update failed', {
        accountId,
        error: error.message
      });

      return false;
    }
  }

  /**
   * Auto-refresh tokens that are expiring soon
   */
  async autoRefreshExpiringTokens(): Promise<{
    refreshed: number;
    failed: number;
    needsManualAuth: string[];
  }> {
    const tokens = await this.getTokensNeedingAttention();
    
    const results = {
      refreshed: 0,
      failed: 0,
      needsManualAuth: [] as string[]
    };

    for (const token of tokens) {
      // Skip if already expired (needs manual re-auth)
      if (token.needsManualAuth) {
        results.needsManualAuth.push(token.accountName);
        logger.warn('Token expired, needs manual re-authentication', {
          accountId: token.accountId,
          accountName: token.accountName,
          provider: token.provider
        });
        continue;
      }

      // Skip if doesn't need refresh yet
      if (!token.needsRefresh) {
        continue;
      }

      // Only refresh Facebook user tokens (not page tokens)
      if (token.provider !== 'facebook') {
        continue;
      }

      logger.info('Attempting token refresh', {
        accountId: token.accountId,
        accountName: token.accountName,
        daysUntilExpiry: token.daysUntilExpiry
      });

      // Get current encrypted token
      const { data: account } = await this.supabase
        .from('autopostvn_social_accounts')
        .select('token_encrypted')
        .eq('id', token.accountId)
        .single();

      if (!account) {
        results.failed++;
        continue;
      }

      // Decrypt token
      const { decrypt } = await import('./encryption');
      const currentToken = decrypt((account as any).token_encrypted);

      // Refresh token
      const refreshResult = await this.refreshFacebookToken(currentToken, token.accountId);

      if (refreshResult.success && refreshResult.newToken && refreshResult.expiresAt) {
        // Update database
        const updated = await this.updateToken(
          token.accountId,
          refreshResult.newToken,
          refreshResult.expiresAt
        );

        if (updated) {
          results.refreshed++;
        } else {
          results.failed++;
        }
      } else {
        results.failed++;
      }
    }

    logger.info('Auto-refresh completed', results);
    return results;
  }

  /**
   * Get expiration summary for dashboard
   */
  async getExpirationSummary(): Promise<{
    healthy: number;
    expiringSoon: number;
    expired: number;
    tokens: TokenInfo[];
  }> {
    const tokens = await this.getTokensNeedingAttention();

    return {
      healthy: tokens.filter(t => !t.needsRefresh && !t.needsManualAuth).length,
      expiringSoon: tokens.filter(t => t.needsRefresh).length,
      expired: tokens.filter(t => t.needsManualAuth).length,
      tokens
    };
  }
}

/**
 * Cron job function to run daily
 */
export async function dailyTokenRefreshCheck(): Promise<void> {
  logger.info('Starting daily token refresh check');

  const service = new TokenRefreshService();
  const results = await service.autoRefreshExpiringTokens();

  logger.info('Daily token refresh check completed', results);

  // TODO: Cần refactor autoRefreshExpiringTokens() để trả về thông tin đầy đủ
  // rồi mới gửi được email thông báo token hết hạn
  if (results.needsManualAuth.length > 0) {
    logger.warn('Accounts need manual re-authentication', {
      accounts: results.needsManualAuth
    });
  }
}

export default TokenRefreshService;

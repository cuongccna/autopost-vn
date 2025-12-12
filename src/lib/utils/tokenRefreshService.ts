/**
 * Token Refresh Service (PostgreSQL Version)
 * 
 * Handles automatic token refresh for social media platforms:
 * - Facebook: Long-lived tokens (60 days)
 * - Instagram: Inherits Facebook token lifecycle
 * - Zalo: Short-lived tokens (25 hours)
 * 
 * Features:
 * - Monitor token expiration
 * - Auto-refresh before expiry
 * - Email notifications
 * - Graceful degradation
 */

import { query, update } from '@/lib/db/postgres';
import logger from './logger';
import { OAuthTokenManager } from '@/lib/services/TokenEncryptionService';

interface TokenInfo {
  accountId: string;
  provider: string;
  accountName: string;
  expiresAt: Date | null;
  daysUntilExpiry: number;
  hoursUntilExpiry: number;
  needsRefresh: boolean;
  needsManualAuth: boolean;
}

interface RefreshResult {
  success: boolean;
  newToken?: string;
  newRefreshToken?: string;
  expiresAt?: Date;
  error?: string;
}

export class TokenRefreshService {
  
  /**
   * Get all tokens that need attention
   */
  async getTokensNeedingAttention(): Promise<TokenInfo[]> {
    try {
      const result = await query(
        `SELECT id, provider, name, expires_at, workspace_id 
         FROM autopostvn_social_accounts 
         WHERE provider IN ('facebook', 'facebook_page', 'instagram', 'zalo') 
         AND status = 'connected'`
      );

      const accounts = result.rows;
      const now = new Date();
      const tokens: TokenInfo[] = [];

      for (const account of accounts) {
        const expiresAt = account.expires_at ? new Date(account.expires_at) : null;
        
        let daysUntilExpiry = Infinity;
        let hoursUntilExpiry = Infinity;
        
        if (expiresAt) {
          const diffMs = expiresAt.getTime() - now.getTime();
          daysUntilExpiry = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          hoursUntilExpiry = Math.floor(diffMs / (1000 * 60 * 60));
        }

        // Facebook Page tokens don't expire
        const isPageToken = account.provider === 'facebook_page';
        
        // Refresh thresholds:
        // Facebook/Instagram: 7 days
        // Zalo: 5 hours (since it expires in 25h)
        let needsRefresh = false;
        if (!isPageToken && expiresAt) {
          if (account.provider === 'zalo') {
            needsRefresh = hoursUntilExpiry <= 5 && hoursUntilExpiry > -1;
          } else {
            needsRefresh = daysUntilExpiry <= 7 && daysUntilExpiry > -1;
          }
        }

        tokens.push({
          accountId: account.id,
          provider: account.provider,
          accountName: account.name,
          expiresAt,
          daysUntilExpiry: isPageToken ? Infinity : daysUntilExpiry,
          hoursUntilExpiry: isPageToken ? Infinity : hoursUntilExpiry,
          needsRefresh,
          needsManualAuth: !isPageToken && hoursUntilExpiry <= -1, // Expired for more than 1 hour
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
   * Refresh Zalo OA token
   */
  async refreshZaloToken(
    refreshToken: string,
    accountId: string
  ): Promise<RefreshResult> {
    try {
      const body = new URLSearchParams({
        app_id: process.env.ZALO_APP_ID!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      });

      console.log('🔄 Refreshing Zalo token...', { accountId });

      const response = await fetch('https://oauth.zaloapp.com/v4/oa/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'secret_key': process.env.ZALO_APP_SECRET!
        },
        body: body.toString()
      });

      const data = await response.json();

      if (data.error) {
        logger.error('Zalo token refresh failed', {
          accountId,
          error: data.error_name || data.message || 'Unknown error',
          details: data
        });

        return {
          success: false,
          error: data.error_name || 'Token refresh failed'
        };
      }

      // Zalo returns: { access_token, refresh_token, expires_in }
      // expires_in is usually 90000 seconds (25 hours)
      const expiresAt = new Date(Date.now() + (parseInt(data.expires_in) * 1000));

      logger.info('Zalo token refreshed successfully', {
        accountId,
        expiresIn: data.expires_in,
        expiresAt: expiresAt.toISOString()
      });

      return {
        success: true,
        newToken: data.access_token,
        newRefreshToken: data.refresh_token, // Zalo rotates refresh tokens
        expiresAt
      };
    } catch (error: any) {
      logger.error('Zalo token refresh error', {
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
    expiresAt: Date,
    newRefreshToken?: string
  ): Promise<boolean> {
    try {
      const encryptedToken = OAuthTokenManager.encryptForStorage(newToken);
      
      const updateData: any = {
        token_encrypted: encryptedToken,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      };

      if (newRefreshToken) {
        updateData.refresh_token_encrypted = OAuthTokenManager.encryptForStorage(newRefreshToken);
      }

      // Build dynamic update query
      const keys = Object.keys(updateData);
      const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
      const values = [accountId, ...Object.values(updateData)];

      await query(
        `UPDATE autopostvn_social_accounts SET ${setClause} WHERE id = $1`,
        values
      );

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

      logger.info('Attempting token refresh', {
        accountId: token.accountId,
        accountName: token.accountName,
        provider: token.provider,
        hoursUntilExpiry: token.hoursUntilExpiry
      });

      // Get current encrypted tokens
      const accountResult = await query(
        'SELECT token_encrypted, refresh_token_encrypted FROM autopostvn_social_accounts WHERE id = $1 LIMIT 1',
        [token.accountId]
      );

      if (accountResult.rows.length === 0) {
        results.failed++;
        continue;
      }

      const account = accountResult.rows[0];
      let refreshResult: RefreshResult = { success: false };

      if (token.provider === 'facebook') {
        const currentToken = OAuthTokenManager.decryptForUse(account.token_encrypted);
        refreshResult = await this.refreshFacebookToken(currentToken, token.accountId);
      } else if (token.provider === 'zalo') {
        if (!account.refresh_token_encrypted) {
          logger.error('No refresh token found for Zalo account', { accountId: token.accountId });
          results.failed++;
          continue;
        }
        const refreshToken = OAuthTokenManager.decryptForUse(account.refresh_token_encrypted);
        refreshResult = await this.refreshZaloToken(refreshToken, token.accountId);
      }

      if (refreshResult.success && refreshResult.newToken && refreshResult.expiresAt) {
        // Update database
        const updated = await this.updateToken(
          token.accountId,
          refreshResult.newToken,
          refreshResult.expiresAt,
          refreshResult.newRefreshToken
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

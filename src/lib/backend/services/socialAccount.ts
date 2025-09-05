// AutoPost VN - Social Account Service
/* eslint-disable no-unused-vars */
import { DatabaseService } from './database';
import { EncryptionService } from '@/lib/backend/utils/encryption';
import {
  SocialAccount,
  ConnectSocialAccountRequest,
  SocialAccountService as ISocialAccountService
} from '../types';

export class SocialAccountService implements ISocialAccountService {
  // eslint-disable-next-line no-unused-vars
  constructor(
    private db: DatabaseService,
    private encryption: EncryptionService
  ) {}

  async connect(workspaceId: string, data: ConnectSocialAccountRequest): Promise<SocialAccount> {
    try {
      // Encrypt the access token
      const encryptedToken = this.encryption.encrypt(data.access_token);
      
      // Extract account info from provider data
      const accountInfo = this.extractAccountInfo(data.provider, data.provider_data);

      // Create social account
      const socialAccount = await this.db.createSocialAccount({
        workspace_id: workspaceId,
        provider: data.provider,
        provider_id: accountInfo.provider_id,
        name: accountInfo.name,
        avatar_url: accountInfo.avatar_url,
        username: accountInfo.username,
        token_encrypted: encryptedToken,
        scopes: accountInfo.scopes || [],
        expires_at: accountInfo.expires_at,
        status: 'connected',
        last_sync_at: new Date().toISOString(),
        metadata: data.provider_data
      });

      // Log analytics event
      await this.db.createAnalyticsEvent({
        workspace_id: workspaceId,
        event_type: 'social_account_connected',
        event_data: {
          provider: data.provider,
          account_id: socialAccount.id,
          account_name: accountInfo.name
        },
        social_account_id: socialAccount.id
      });

      return socialAccount;
    } catch (error) {
      // Log error
      await this.db.createErrorLog({
        workspace_id: workspaceId,
        error_type: 'social_account_connection_failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_stack: error instanceof Error ? error.stack : undefined,
        context: { provider: data.provider, provider_data: data.provider_data }
      });

      throw error;
    }
  }

  async disconnect(id: string): Promise<void> {
    try {
      const account = await this.db.getSocialAccount(id);
      if (!account) {
        throw new Error('Social account not found');
      }

      // Update status to disconnected
      await this.db.updateSocialAccount(id, {
        status: 'disconnected',
        token_encrypted: '',
        refresh_token_encrypted: ''
      });

      // Log analytics event
      await this.db.createAnalyticsEvent({
        workspace_id: account.workspace_id,
        event_type: 'social_account_disconnected',
        event_data: {
          provider: account.provider,
          account_id: id,
          account_name: account.name
        },
        social_account_id: id
      });
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(id: string): Promise<SocialAccount> {
    try {
      const account = await this.db.getSocialAccount(id);
      if (!account) {
        throw new Error('Social account not found');
      }

      // Get fresh token from provider
      const newTokenData = await this.getRefreshToken(account);
      
      // Encrypt new token
      const encryptedToken = this.encryption.encrypt(newTokenData.access_token);
      
      // Update account
      const updatedAccount = await this.db.updateSocialAccount(id, {
        token_encrypted: encryptedToken,
        expires_at: newTokenData.expires_at,
        status: 'connected',
        last_sync_at: new Date().toISOString()
      });

      // Log analytics event
      await this.db.createAnalyticsEvent({
        workspace_id: account.workspace_id,
        event_type: 'social_account_token_refreshed',
        event_data: {
          provider: account.provider,
          account_id: id,
          account_name: account.name
        },
        social_account_id: id
      });

      return updatedAccount;
    } catch (error) {
      // Mark account as expired if refresh fails
      await this.db.updateSocialAccount(id, {
        status: 'expired'
      });

      throw error;
    }
  }

  async findByWorkspace(workspaceId: string): Promise<SocialAccount[]> {
    return await this.db.getSocialAccounts(workspaceId);
  }

  async findById(id: string): Promise<SocialAccount | null> {
    return await this.db.getSocialAccount(id);
  }

  // Get decrypted access token for API calls
  async getAccessToken(id: string): Promise<string> {
    const account = await this.db.getSocialAccount(id);
    if (!account) {
      throw new Error('Social account not found');
    }

    if (account.status !== 'connected') {
      throw new Error('Social account is not connected');
    }

    // Check if token is expired
    if (account.expires_at && new Date(account.expires_at) <= new Date()) {
      // Try to refresh token
      await this.refreshToken(id);
      const refreshedAccount = await this.db.getSocialAccount(id);
      return this.encryption.decrypt(refreshedAccount!.token_encrypted);
    }

    return this.encryption.decrypt(account.token_encrypted);
  }

  // Update account metadata (e.g., page info, follower count)
  async updateMetadata(id: string, metadata: Record<string, any>): Promise<SocialAccount> {
    const account = await this.db.getSocialAccount(id);
    if (!account) {
      throw new Error('Social account not found');
    }

    return await this.db.updateSocialAccount(id, {
      metadata: { ...account.metadata, ...metadata },
      last_sync_at: new Date().toISOString()
    });
  }

  // Check account health (token validity, permissions)
  async checkAccountHealth(id: string): Promise<{
    isHealthy: boolean;
    issues: string[];
    lastChecked: string;
  }> {
    try {
      const account = await this.db.getSocialAccount(id);
      if (!account) {
        return {
          isHealthy: false,
          issues: ['Account not found'],
          lastChecked: new Date().toISOString()
        };
      }

      const issues: string[] = [];

      // Check connection status
      if (account.status !== 'connected') {
        issues.push(`Account status: ${account.status}`);
      }

      // Check token expiry
      if (account.expires_at && new Date(account.expires_at) <= new Date()) {
        issues.push('Access token expired');
      }

      // Check if token is valid by making a test API call
      try {
        const isValid = await this.validateToken(account);
        if (!isValid) {
          issues.push('Token validation failed');
        }
      } catch (error) {
        issues.push('Token validation error');
      }

      const isHealthy = issues.length === 0;

      // Update account status if unhealthy
      if (!isHealthy && account.status === 'connected') {
        await this.db.updateSocialAccount(id, {
          status: 'error'
        });
      }

      return {
        isHealthy,
        issues,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        isHealthy: false,
        issues: ['Health check failed'],
        lastChecked: new Date().toISOString()
      };
    }
  }

  private extractAccountInfo(provider: string, providerData: any): {
    provider_id: string;
    name: string;
    avatar_url?: string;
    username?: string;
    scopes?: string[];
    expires_at?: string;
  } {
    switch (provider) {
      case 'facebook':
        return {
          provider_id: providerData.id || providerData.page_id,
          name: providerData.name,
          avatar_url: providerData.picture?.data?.url,
          username: providerData.username,
          scopes: providerData.scopes,
          expires_at: providerData.expires_at
        };

      case 'instagram':
        return {
          provider_id: providerData.id || providerData.account_id,
          name: providerData.name || providerData.username,
          avatar_url: providerData.profile_picture_url,
          username: providerData.username,
          scopes: providerData.scopes,
          expires_at: providerData.expires_at
        };

      case 'zalo':
        return {
          provider_id: providerData.id || providerData.oa_id,
          name: providerData.name,
          avatar_url: providerData.avatar,
          username: providerData.alias,
          scopes: providerData.scopes,
          expires_at: providerData.expires_at
        };

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async getRefreshToken(account: SocialAccount): Promise<{
    access_token: string;
    expires_at?: string;
  }> {
    // TODO: Implement actual token refresh logic for each provider
    // This is a mock implementation
    switch (account.provider) {
      case 'facebook':
        // Facebook token refresh logic
        return {
          access_token: 'new_facebook_token_' + Date.now(),
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
        };

      case 'instagram':
        // Instagram token refresh logic
        return {
          access_token: 'new_instagram_token_' + Date.now(),
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
        };

      case 'zalo':
        // Zalo token refresh logic
        return {
          access_token: 'new_zalo_token_' + Date.now(),
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
        };

      default:
        throw new Error(`Token refresh not implemented for provider: ${account.provider}`);
    }
  }

  private async validateToken(account: SocialAccount): Promise<boolean> {
    try {
      const token = this.encryption.decrypt(account.token_encrypted);
      
      // TODO: Make actual API calls to validate tokens
      // This is a mock implementation
      switch (account.provider) {
        case 'facebook':
          // Call Facebook Graph API to validate token
          return token.includes('facebook_token');

        case 'instagram':
          // Call Instagram Basic Display API to validate token
          return token.includes('instagram_token');

        case 'zalo':
          // Call Zalo API to validate token
          return token.includes('zalo_token');

        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }
}

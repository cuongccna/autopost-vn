import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface UserWorkspace {
  id: string;
  user_email: string;
  workspace_name: string;
  created_at: string;
  settings: {
    default_timezone?: string;
    auto_post?: boolean;
    notification_preferences?: {
      email?: boolean;
      browser?: boolean;
    };
  };
}

export interface UserSocialAccount {
  id: string;
  user_email: string;
  workspace_id: string;
  provider: 'facebook' | 'instagram' | 'zalo';
  account_name: string;
  provider_account_id: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  account_data: {
    name: string;
    category?: string;
    profile_picture?: string;
    follower_count?: number;
  };
  status: 'connected' | 'expired' | 'error';
  created_at: string;
  updated_at: string;
}

export class UserManagementService {
  // Create or get user workspace
  async getOrCreateUserWorkspace(userEmail: string): Promise<UserWorkspace> {
    // First, try to get existing workspace
    const { data: existing, error: fetchError } = await supabase
      .from('autopostvn_user_workspaces')
      .select('*')
      .eq('user_email', userEmail)
      .single();

    if (existing && !fetchError) {
      return existing;
    }

    // Create new workspace
    const newWorkspace = {
      user_email: userEmail,
      workspace_name: `${userEmail}'s Workspace`,
      settings: {
        default_timezone: 'Asia/Ho_Chi_Minh',
        auto_post: true,
        notification_preferences: {
          email: true,
          browser: true,
        },
      },
    };

    const { data, error } = await supabase
      .from('autopostvn_user_workspaces')
      .insert(newWorkspace)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create workspace: ${error.message}`);
    }

    return data;
  }

  // Get user's social accounts
  async getUserSocialAccounts(userEmail: string): Promise<UserSocialAccount[]> {
    const { data, error } = await supabase
      .from('autopostvn_user_social_accounts')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch social accounts: ${error.message}`);
    }

    return data || [];
  }

  // Save OAuth account
  async saveOAuthAccount(
    userEmail: string,
    provider: string,
    oauthData: {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      account_info: any;
    }
  ): Promise<UserSocialAccount> {
    const workspace = await this.getOrCreateUserWorkspace(userEmail);

    // Validate required fields
    if (!oauthData.account_info.providerId) {
      throw new Error(`Missing provider account ID for ${provider}`);
    }

    const accountData = {
      user_email: userEmail,
      workspace_id: workspace.id,
      provider: provider as 'facebook' | 'instagram' | 'zalo',
      account_name: oauthData.account_info.name || `${provider} Account`,
      provider_account_id: oauthData.account_info.providerId,
      access_token: oauthData.access_token,
      refresh_token: oauthData.refresh_token,
      token_expires_at: oauthData.expires_in
        ? new Date(Date.now() + oauthData.expires_in * 1000).toISOString()
        : null,
      account_data: oauthData.account_info,
      status: 'connected' as const,
    };

    const { data, error } = await supabase
      .from('autopostvn_user_social_accounts')
      .insert(accountData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save OAuth account: ${error.message}`);
    }

    return data;
  }

  // Update account status
  async updateAccountStatus(
    accountId: string,
    status: 'connected' | 'expired' | 'error'
  ): Promise<void> {
    const { error } = await supabase
      .from('autopostvn_user_social_accounts')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId);

    if (error) {
      throw new Error(`Failed to update account status: ${error.message}`);
    }
  }

  // Disconnect account
  async disconnectAccount(accountId: string, userEmail: string): Promise<void> {
    const { error } = await supabase
      .from('autopostvn_user_social_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_email', userEmail); // Security: only delete own accounts

    if (error) {
      throw new Error(`Failed to disconnect account: ${error.message}`);
    }
  }

  // Refresh token for account
  async refreshAccountToken(accountId: string): Promise<UserSocialAccount> {
    // Get account details
    const { data: account, error: fetchError } = await supabase
      .from('autopostvn_user_social_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (fetchError || !account) {
      throw new Error('Account not found');
    }

    // Attempt to refresh token based on provider
    let newTokenData;
    try {
      newTokenData = await this.refreshProviderToken(
        account.provider,
        account.refresh_token
      );
    } catch (error) {
      // Mark account as expired if refresh fails
      await this.updateAccountStatus(accountId, 'error');
      throw error;
    }

    // Update account with new token
    const { data, error } = await supabase
      .from('autopostvn_user_social_accounts')
      .update({
        access_token: newTokenData.access_token,
        refresh_token: newTokenData.refresh_token || account.refresh_token,
        token_expires_at: newTokenData.expires_in
          ? new Date(Date.now() + newTokenData.expires_in * 1000).toISOString()
          : null,
        status: 'connected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update account token: ${error.message}`);
    }

    return data;
  }

  // Provider-specific token refresh
  private async refreshProviderToken(
    provider: string,
    refreshToken?: string
  ): Promise<any> {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const refreshUrls = {
      facebook: 'https://graph.facebook.com/v18.0/oauth/access_token',
      instagram: 'https://graph.facebook.com/v18.0/oauth/access_token',
      zalo: 'https://oauth.zaloapp.com/v4/oa/access_token',
    };

    const clientIds = {
      facebook: process.env.FACEBOOK_CLIENT_ID!,
      instagram: process.env.FACEBOOK_CLIENT_ID!,
      zalo: process.env.ZALO_CLIENT_ID!,
    };

    const clientSecrets = {
      facebook: process.env.FACEBOOK_CLIENT_SECRET!,
      instagram: process.env.FACEBOOK_CLIENT_SECRET!,
      zalo: process.env.ZALO_CLIENT_SECRET!,
    };

    const params = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientIds[provider as keyof typeof clientIds],
      client_secret: clientSecrets[provider as keyof typeof clientSecrets],
    };

    const response = await fetch(
      refreshUrls[provider as keyof typeof refreshUrls],
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params),
      }
    );

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get user's posts (filtered by their accounts)
  async getUserPosts(userEmail: string): Promise<any[]> {
    // Get user's social accounts first
    const accounts = await this.getUserSocialAccounts(userEmail);
    const accountIds = accounts.map(acc => acc.id);

    if (accountIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('autopostvn_posts')
      .select('*')
      .in('account_id', accountIds) // Assuming posts have account_id field
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user posts: ${error.message}`);
    }

    return data || [];
  }
}

export const userManagementService = new UserManagementService();

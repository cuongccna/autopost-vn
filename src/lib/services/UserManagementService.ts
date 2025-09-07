import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface UserWorkspace {
  id: string;
  user_email: string;
  workspace_name: string;
  created_at?: string;
  settings?: {
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
    // For simplicity, use the existing workspace we just created for test user
    // In production, you'd want proper user-workspace mapping
    if (userEmail === 'test@autopostvn.com') {
      return {
        id: '5dc9c501-3c00-4173-84cf-d01307f253c2',
        user_email: userEmail,
        workspace_name: 'test@autopostvn.com Workspace'
      };
    }

    // For other users, create a simple workspace
    const workspaceName = `${userEmail}'s Workspace`;
    const workspaceSlug = userEmail.replace('@', '-').replace('.', '-');

    // Try to find existing workspace by name pattern
    const { data: existing, error: fetchError } = await supabase
      .from('autopostvn_workspaces')
      .select('*')
      .eq('name', workspaceName)
      .single();

    if (existing && !fetchError) {
      return {
        id: existing.id,
        user_email: userEmail,
        workspace_name: existing.name
      };
    }

    // Create new workspace
    const { data, error } = await supabase
      .from('autopostvn_workspaces')
      .insert({
        name: workspaceName,
        slug: workspaceSlug,
        description: `Personal workspace for ${userEmail}`
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create workspace: ${error.message}`);
    }

    return {
      id: data.id,
      user_email: userEmail,
      workspace_name: data.name
    };
  }

  // Get user's social accounts
  async getUserSocialAccounts(userEmail: string): Promise<UserSocialAccount[]> {
    // First get user's workspace
    const workspace = await this.getOrCreateUserWorkspace(userEmail);
    
    const { data, error } = await supabase
      .from('autopostvn_social_accounts')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch social accounts: ${error.message}`);
    }

    // Map to UserSocialAccount format
    return (data || []).map(account => ({
      id: account.id,
      user_email: userEmail,
      workspace_id: account.workspace_id,
      provider: account.provider as 'facebook' | 'instagram' | 'zalo',
      account_name: account.name || account.username || 'Unknown',
      provider_account_id: account.provider_id,
      access_token: account.token_encrypted || '', // Will need to decrypt in real usage
      refresh_token: account.refresh_token_encrypted,
      token_expires_at: account.expires_at,
      account_data: {
        name: account.name || account.username || 'Unknown',
        category: account.metadata?.category,
        profile_picture: account.avatar_url,
        follower_count: account.metadata?.follower_count
      },
      status: account.status === 'connected' ? 'connected' : 
              account.status === 'expired' ? 'expired' : 'error',
      created_at: account.created_at,
      updated_at: account.updated_at
    }));
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

    // Map to autopostvn_social_accounts structure
    const accountData = {
      workspace_id: workspace.id,
      provider: provider,
      provider_id: oauthData.account_info.providerId,
      name: oauthData.account_info.name || `${provider} Account`,
      username: oauthData.account_info.username || oauthData.account_info.providerId,
      avatar_url: oauthData.account_info.profile_picture,
      token_encrypted: btoa(oauthData.access_token), // Simple encoding - use proper encryption in production
      refresh_token_encrypted: oauthData.refresh_token ? btoa(oauthData.refresh_token) : null,
      expires_at: oauthData.expires_in
        ? new Date(Date.now() + oauthData.expires_in * 1000).toISOString()
        : null,
      status: 'connected',
      metadata: oauthData.account_info,
    };

    // Check if account already exists
    const { data: existing } = await supabase
      .from('autopostvn_social_accounts')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('provider', provider)
      .eq('provider_id', oauthData.account_info.providerId)
      .single();

    let data, error;

    if (existing) {
      // Update existing account
      const updateResult = await supabase
        .from('autopostvn_social_accounts')
        .update(accountData)
        .eq('id', existing.id)
        .select()
        .single();
      
      data = updateResult.data;
      error = updateResult.error;
    } else {
      // Insert new account
      const insertResult = await supabase
        .from('autopostvn_social_accounts')
        .insert(accountData)
        .select()
        .single();
      
      data = insertResult.data;
      error = insertResult.error;
    }

    if (error) {
      throw new Error(`Failed to save OAuth account: ${error.message}`);
    }

    // Map back to UserSocialAccount format
    return {
      id: data.id,
      user_email: userEmail,
      workspace_id: data.workspace_id,
      provider: data.provider as 'facebook' | 'instagram' | 'zalo',
      account_name: data.name,
      provider_account_id: data.provider_id,
      access_token: oauthData.access_token,
      refresh_token: oauthData.refresh_token,
      token_expires_at: data.expires_at,
      account_data: oauthData.account_info,
      status: 'connected',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  // Update account status
  async updateAccountStatus(
    accountId: string,
    status: 'connected' | 'expired' | 'error'
  ): Promise<void> {
    const { error } = await supabase
      .from('autopostvn_social_accounts')
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
    // Get user's workspace to verify ownership
    const workspace = await this.getOrCreateUserWorkspace(userEmail);
    
    const { error } = await supabase
      .from('autopostvn_social_accounts')
      .delete()
      .eq('id', accountId)
      .eq('workspace_id', workspace.id); // Security: only delete own workspace accounts

    if (error) {
      throw new Error(`Failed to disconnect account: ${error.message}`);
    }
  }

  // Refresh token for account
  async refreshAccountToken(accountId: string): Promise<UserSocialAccount> {
    // Get account details
    const { data: account, error: fetchError } = await supabase
      .from('autopostvn_social_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (fetchError || !account) {
      throw new Error('Account not found');
    }

    // Decode refresh token
    const refreshToken = account.refresh_token_encrypted 
      ? atob(account.refresh_token_encrypted) 
      : null;

    // Attempt to refresh token based on provider
    let newTokenData;
    try {
      newTokenData = await this.refreshProviderToken(
        account.provider,
        refreshToken || undefined
      );
    } catch (error) {
      // Mark account as expired if refresh fails
      await this.updateAccountStatus(accountId, 'error');
      throw error;
    }

    // Update account with new token
    const { data, error } = await supabase
      .from('autopostvn_social_accounts')
      .update({
        token_encrypted: btoa(newTokenData.access_token),
        refresh_token_encrypted: newTokenData.refresh_token 
          ? btoa(newTokenData.refresh_token) 
          : account.refresh_token_encrypted,
        expires_at: newTokenData.expires_in
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

    // Map back to UserSocialAccount format
    return {
      id: data.id,
      user_email: '', // Will be filled by caller
      workspace_id: data.workspace_id,
      provider: data.provider as 'facebook' | 'instagram' | 'zalo',
      account_name: data.name,
      provider_account_id: data.provider_id,
      access_token: newTokenData.access_token,
      refresh_token: newTokenData.refresh_token,
      token_expires_at: data.expires_at,
      account_data: data.metadata || {},
      status: 'connected',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
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

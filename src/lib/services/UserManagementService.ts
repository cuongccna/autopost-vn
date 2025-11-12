/**
 * Example: UserManagementService using PostgreSQL
 * This is a working example showing how to migrate from Supabase to PostgreSQL
 * 
 * Copy patterns from this file to migrate other services
 */

import { query, insert, update as updateRecord, deleteFrom } from '@/lib/db/postgres';
import { OAuthTokenManager } from './TokenEncryptionService';

export interface UserWorkspace {
  id: string;
  user_email: string;
  workspace_name: string;
  created_at?: string;
  settings?: any;
}

export interface UserSocialAccount {
  id: string;
  user_email: string;
  workspace_id: string;
  provider: 'facebook' | 'facebook_page' | 'instagram' | 'zalo';
  account_name: string;
  provider_account_id: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  account_data: any;
  status: 'connected' | 'expired' | 'error';
  created_at: string;
  updated_at: string;
}

export class UserManagementServicePG {
  /**
   * Get or create user workspace (1:1 mapping with user_id)
   */
  async getOrCreateUserWorkspace(userEmail: string): Promise<UserWorkspace> {
    // First, get user by email
    const userResult = await query(
      'SELECT id, email, full_name FROM autopostvn_users WHERE email = $1 LIMIT 1',
      [userEmail]
    )

    if (userResult.rows.length === 0) {
      throw new Error(`User not found: ${userEmail}`)
    }

    const user = userResult.rows[0]
    
    // Try to find existing workspace by user_id (more reliable than slug)
    const existingResult = await query(
      'SELECT * FROM autopostvn_workspaces WHERE user_id = $1 LIMIT 1',
      [user.id]
    )

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0]
      return {
        id: existing.id,
        user_email: userEmail,
        workspace_name: existing.name,
        created_at: existing.created_at,
        settings: existing.settings
      }
    }

    // Create new workspace (1:1 with user) if not exists
    const workspaceSlug = `user-${user.id.substring(0, 8)}`
    const workspaceName = `${user.full_name || userEmail}'s Workspace`
    
    const newWorkspace = await insert('autopostvn_workspaces', {
      user_id: user.id,  // ✅ Set user_id FK
      name: workspaceName,
      slug: workspaceSlug,
      description: `Personal workspace for ${userEmail}`,
      settings: JSON.stringify({})
    })

    const data = newWorkspace[0]
    return {
      id: data.id,
      user_email: userEmail,
      workspace_name: data.name,
      created_at: data.created_at,
      settings: data.settings
    }
  }

  /**
   * Get user's social accounts
   */
  async getUserSocialAccounts(userEmail: string): Promise<UserSocialAccount[]> {
    const workspace = await this.getOrCreateUserWorkspace(userEmail);
    
    const result = await query(
      `SELECT * FROM autopostvn_social_accounts 
       WHERE workspace_id = $1 
       ORDER BY created_at DESC`,
      [workspace.id]
    );

    return result.rows.map((account: any) => ({
      id: account.id,
      user_email: userEmail,
      workspace_id: account.workspace_id,
      provider: account.provider,
      account_name: account.name || account.username || 'Unknown',
      provider_account_id: account.provider_id,
      access_token: OAuthTokenManager.decryptForUse(account.token_encrypted || ''),
      refresh_token: account.refresh_token_encrypted,
      token_expires_at: account.expires_at,
      account_data: account.metadata || {},
      status: account.status,
      created_at: account.created_at,
      updated_at: account.updated_at
    }));
  }

  /**
   * Save OAuth account
   */
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

    if (!oauthData.account_info.providerId) {
      throw new Error(`Missing provider account ID for ${provider}`);
    }

    const accountData = {
      workspace_id: workspace.id,
      provider: provider,
      provider_id: oauthData.account_info.providerId,
      name: oauthData.account_info.name || `${provider} Account`,
      username: oauthData.account_info.username || oauthData.account_info.providerId,
      avatar_url: oauthData.account_info.profile_picture,
      token_encrypted: OAuthTokenManager.encryptForStorage(oauthData.access_token),
      refresh_token_encrypted: oauthData.refresh_token ? OAuthTokenManager.encryptForStorage(oauthData.refresh_token) : null,
      expires_at: oauthData.expires_in
        ? new Date(Date.now() + oauthData.expires_in * 1000).toISOString()
        : null,
      status: 'connected',
      metadata: oauthData.account_info,
    };

    // Check if account exists
    const existingResult = await query(
      `SELECT * FROM autopostvn_social_accounts 
       WHERE workspace_id = $1 AND provider = $2 AND provider_id = $3 LIMIT 1`,
      [workspace.id, provider, oauthData.account_info.providerId]
    );

    let resultData;

    if (existingResult.rows.length > 0) {
      // Update existing
      const existing = existingResult.rows[0];
      const updated = await updateRecord(
        'autopostvn_social_accounts',
        accountData,
        { id: existing.id }
      );
      resultData = updated[0];
    } else {
      // Insert new
      const inserted = await insert('autopostvn_social_accounts', accountData);
      resultData = inserted[0];
    }

    return {
      id: resultData.id,
      user_email: userEmail,
      workspace_id: resultData.workspace_id,
      provider: resultData.provider,
      account_name: resultData.name,
      provider_account_id: resultData.provider_id,
      access_token: oauthData.access_token,
      refresh_token: oauthData.refresh_token,
      token_expires_at: resultData.expires_at,
      account_data: oauthData.account_info,
      status: 'connected',
      created_at: resultData.created_at,
      updated_at: resultData.updated_at
    };
  }

  /**
   * Update account status
   */
  async updateAccountStatus(
    accountId: string,
    status: 'connected' | 'expired' | 'error'
  ): Promise<void> {
    await updateRecord(
      'autopostvn_social_accounts',
      { status }, // removed updated_at - auto-handled by trigger
      { id: accountId }
    );
  }

  /**
   * Disconnect account
   */
  async disconnectAccount(accountId: string, userEmail: string): Promise<void> {
    const workspace = await this.getOrCreateUserWorkspace(userEmail);
    
    await query(
      `DELETE FROM autopostvn_social_accounts 
       WHERE id = $1 AND workspace_id = $2`,
      [accountId, workspace.id]
    );
  }

  /**
   * Get user's posts
   */
  async getUserPosts(userEmail: string): Promise<any[]> {
    const accounts = await this.getUserSocialAccounts(userEmail);
    
    if (accounts.length === 0) {
      return [];
    }

    const accountIds = accounts.map(acc => acc.id);
    const placeholders = accountIds.map((_, i) => `$${i + 1}`).join(', ');
    
    const result = await query(
      `SELECT * FROM autopostvn_posts 
       WHERE account_id IN (${placeholders}) 
       ORDER BY created_at DESC`,
      accountIds
    );

    return result.rows;
  }
}

export const userManagementServicePG = new UserManagementServicePG();

// Alias for backward compatibility
export const userManagementService = userManagementServicePG;
export { UserManagementServicePG as UserManagementService };

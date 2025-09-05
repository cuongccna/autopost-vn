// AutoPost VN - Database Service
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Workspace,
  SocialAccount,
  Post,
  PostSchedule,
  AnalyticsEvent,
  ErrorLog,
  DatabaseConfig
} from '../types';

export class DatabaseService {
  private supabase: SupabaseClient;
  private schema: string;

  constructor(config: DatabaseConfig) {
    // Tạo Supabase client với custom schema
    this.schema = config.schema || 'AutoPostVN';
    this.supabase = createClient(config.url, config.key);
    
    // Set default schema cho tất cả queries
    if (this.schema !== 'public') {
      // Supabase JS client không hỗ trợ schema switching tự động
      // Sẽ cần sử dụng raw SQL hoặc cấu hình Supabase settings
      console.warn(`Using custom schema: ${this.schema}. Ensure your Supabase project is configured correctly.`);
    }
  }

  // ========================================
  // WORKSPACE METHODS
  // ========================================

  async getWorkspace(id: string): Promise<Workspace | null> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching workspace:', error);
      return null;
    }

    return data;
  }

  async createWorkspace(workspace: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>): Promise<Workspace> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .insert(workspace)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create workspace: ${error.message}`);
    }

    return data;
  }

  // ========================================
  // SOCIAL ACCOUNT METHODS
  // ========================================

  async getSocialAccounts(workspaceId: string): Promise<SocialAccount[]> {
    const { data, error } = await this.supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching social accounts:', error);
      return [];
    }

    return data || [];
  }

  async getSocialAccount(id: string): Promise<SocialAccount | null> {
    const { data, error } = await this.supabase
      .from('social_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching social account:', error);
      return null;
    }

    return data;
  }

  async createSocialAccount(account: Omit<SocialAccount, 'id' | 'created_at' | 'updated_at'>): Promise<SocialAccount> {
    const { data, error } = await this.supabase
      .from('social_accounts')
      .insert(account)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create social account: ${error.message}`);
    }

    return data;
  }

  async updateSocialAccount(id: string, updates: Partial<SocialAccount>): Promise<SocialAccount> {
    const { data, error } = await this.supabase
      .from('social_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update social account: ${error.message}`);
    }

    return data;
  }

  async deleteSocialAccount(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('social_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete social account: ${error.message}`);
    }
  }

  // ========================================
  // POST METHODS
  // ========================================

  async getPosts(workspaceId: string, filters?: {
    status?: Post['status'];
    limit?: number;
    offset?: number;
  }): Promise<Post[]> {
    let query = this.supabase
      .from('posts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return [];
    }

    return data || [];
  }

  async getPost(id: string): Promise<Post | null> {
    const { data, error } = await this.supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      return null;
    }

    return data;
  }

  async createPost(post: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<Post> {
    const { data, error } = await this.supabase
      .from('posts')
      .insert(post)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create post: ${error.message}`);
    }

    return data;
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    const { data, error } = await this.supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update post: ${error.message}`);
    }

    return data;
  }

  async deletePost(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  // ========================================
  // POST SCHEDULE METHODS
  // ========================================

  async getPostSchedules(postId?: string, socialAccountId?: string): Promise<PostSchedule[]> {
    let query = this.supabase
      .from('post_schedules')
      .select(`
        *,
        post:posts(*),
        social_account:social_accounts(*)
      `)
      .order('scheduled_at', { ascending: true });

    if (postId) {
      query = query.eq('post_id', postId);
    }

    if (socialAccountId) {
      query = query.eq('social_account_id', socialAccountId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching post schedules:', error);
      return [];
    }

    return data || [];
  }

  async createPostSchedule(schedule: Omit<PostSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<PostSchedule> {
    const { data, error } = await this.supabase
      .from('post_schedules')
      .insert(schedule)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create post schedule: ${error.message}`);
    }

    return data;
  }

  async updatePostSchedule(id: string, updates: Partial<PostSchedule>): Promise<PostSchedule> {
    const { data, error } = await this.supabase
      .from('post_schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update post schedule: ${error.message}`);
    }

    return data;
  }

  async getPendingSchedules(limit?: number): Promise<PostSchedule[]> {
    let query = this.supabase
      .from('post_schedules')
      .select(`
        *,
        post:posts(*),
        social_account:social_accounts(*)
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pending schedules:', error);
      return [];
    }

    return data || [];
  }

  // ========================================
  // ANALYTICS METHODS
  // ========================================

  async createAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'created_at'>): Promise<AnalyticsEvent> {
    const { data, error } = await this.supabase
      .from('analytics_events')
      .insert(event)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create analytics event: ${error.message}`);
    }

    return data;
  }

  async getAnalyticsEvents(workspaceId: string, filters?: {
    event_type?: string;
    from_date?: string;
    to_date?: string;
    limit?: number;
  }): Promise<AnalyticsEvent[]> {
    let query = this.supabase
      .from('analytics_events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (filters?.event_type) {
      query = query.eq('event_type', filters.event_type);
    }

    if (filters?.from_date) {
      query = query.gte('created_at', filters.from_date);
    }

    if (filters?.to_date) {
      query = query.lte('created_at', filters.to_date);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching analytics events:', error);
      return [];
    }

    return data || [];
  }

  async getPostAnalytics(workspaceId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('post_analytics')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Error fetching post analytics:', error);
      return [];
    }

    return data || [];
  }

  async getAccountPerformance(workspaceId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('account_performance')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Error fetching account performance:', error);
      return [];
    }

    return data || [];
  }

  // ========================================
  // ERROR LOG METHODS
  // ========================================

  async createErrorLog(errorLog: Omit<ErrorLog, 'id' | 'created_at'>): Promise<ErrorLog> {
    const { data, error } = await this.supabase
      .from('error_logs')
      .insert(errorLog)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create error log: ${error.message}`);
    }

    return data;
  }

  async getErrorLogs(workspaceId: string, filters?: {
    resolved?: boolean;
    limit?: number;
  }): Promise<ErrorLog[]> {
    let query = this.supabase
      .from('error_logs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (filters?.resolved === false) {
      query = query.is('resolved_at', null);
    } else if (filters?.resolved === true) {
      query = query.not('resolved_at', 'is', null);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching error logs:', error);
      return [];
    }

    return data || [];
  }

  async resolveErrorLog(id: string): Promise<ErrorLog> {
    const { data, error } = await this.supabase
      .from('error_logs')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to resolve error log: ${error.message}`);
    }

    return data;
  }
}

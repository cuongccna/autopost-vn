/**
 * Buffer API Service
 * Handles integration with Buffer for scheduling social media posts
 * API Documentation: https://buffer.com/developers/api
 */

interface BufferProfile {
  id: string;
  service: 'facebook' | 'twitter' | 'linkedin' | 'instagram';
  service_id: string;
  service_username: string;
  formatted_service: string;
  timezone: string;
  schedules?: BufferSchedule[];
}

interface BufferSchedule {
  days: string[];
  times: string[];
}

interface BufferUpdate {
  id: string;
  profile_id: string;
  text: string;
  media?: {
    link?: string;
    photo?: string;
    thumbnail?: string;
  };
  scheduled_at?: number;
  status: 'buffer' | 'sent' | 'failed';
  created_at: number;
  updated_at?: number;
}

interface CreateBufferPostParams {
  profile_ids: string[];
  text: string;
  media?: {
    photo?: string;
    link?: string;
    thumbnail?: string;
  };
  scheduled_at?: number; // Unix timestamp
  now?: boolean;
  top?: boolean;
  shorten?: boolean;
}

interface BufferApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class BufferService {
  private apiUrl: string;
  private accessToken: string;

  constructor() {
    this.apiUrl = process.env.BUFFER_API_URL || 'https://api.bufferapp.com/1';
    this.accessToken = process.env.BUFFER_ACCESS_TOKEN || '';

    if (!this.accessToken) {
      console.warn('⚠️ Buffer access token not configured');
    }
  }

  /**
   * Make API request to Buffer
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<BufferApiResponse<T>> {
    try {
      const url = `${this.apiUrl}${endpoint}`;
      const options: Record<string, any> = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Add access token to URL
      const urlWithToken = `${url}${url.includes('?') ? '&' : '?'}access_token=${this.accessToken}`;

      if (body && method === 'POST') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(urlWithToken, options);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Buffer API request failed',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Buffer API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user info
   */
  async getUser() {
    return this.makeRequest('/user.json');
  }

  /**
   * Get all profiles (social accounts) connected to Buffer
   */
  async getProfiles(): Promise<BufferApiResponse<BufferProfile[]>> {
    return this.makeRequest<BufferProfile[]>('/profiles.json');
  }

  /**
   * Get a specific profile
   */
  async getProfile(profileId: string): Promise<BufferApiResponse<BufferProfile>> {
    return this.makeRequest<BufferProfile>(`/profiles/${profileId}.json`);
  }

  /**
   * Get pending updates for a profile
   */
  async getPendingUpdates(profileId: string): Promise<BufferApiResponse<{ updates: BufferUpdate[] }>> {
    return this.makeRequest<{ updates: BufferUpdate[] }>(`/profiles/${profileId}/updates/pending.json`);
  }

  /**
   * Get sent updates for a profile
   */
  async getSentUpdates(profileId: string): Promise<BufferApiResponse<{ updates: BufferUpdate[] }>> {
    return this.makeRequest<{ updates: BufferUpdate[] }>(`/profiles/${profileId}/updates/sent.json`);
  }

  /**
   * Create a new post (update)
   */
  async createPost(params: CreateBufferPostParams): Promise<BufferApiResponse<{ updates: BufferUpdate[] }>> {
    return this.makeRequest<{ updates: BufferUpdate[] }>('/updates/create.json', 'POST', params);
  }

  /**
   * Update an existing post
   */
  async updatePost(updateId: string, params: Partial<CreateBufferPostParams>): Promise<BufferApiResponse<BufferUpdate>> {
    return this.makeRequest<BufferUpdate>(`/updates/${updateId}/update.json`, 'POST', params);
  }

  /**
   * Delete a post
   */
  async deletePost(updateId: string): Promise<BufferApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(`/updates/${updateId}/destroy.json`, 'POST');
  }

  /**
   * Move a scheduled post to the top of the queue
   */
  async moveToTop(updateId: string): Promise<BufferApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(`/updates/${updateId}/move_to_top.json`, 'POST');
  }

  /**
   * Share a post immediately
   */
  async shareNow(updateId: string): Promise<BufferApiResponse<BufferUpdate>> {
    return this.makeRequest<BufferUpdate>(`/updates/${updateId}/share.json`, 'POST');
  }

  /**
   * Get posting schedule for a profile
   */
  async getSchedule(profileId: string): Promise<BufferApiResponse<BufferSchedule[]>> {
    return this.makeRequest<BufferSchedule[]>(`/profiles/${profileId}/schedules.json`);
  }

  /**
   * Update posting schedule for a profile
   */
  async updateSchedule(
    profileId: string,
    schedules: BufferSchedule[]
  ): Promise<BufferApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(
      `/profiles/${profileId}/schedules/update.json`,
      'POST',
      { schedules }
    );
  }

  /**
   * Helper: Schedule a post with our app format
   */
  async schedulePost(params: {
    profileIds: string[];
    content: string;
    media?: string[];
    scheduledAt?: Date;
    postNow?: boolean;
  }): Promise<BufferApiResponse<{ updates: BufferUpdate[] }>> {
    const bufferParams: CreateBufferPostParams = {
      profile_ids: params.profileIds,
      text: params.content,
      now: params.postNow || false,
      shorten: true, // Auto-shorten links
    };

    // Add media if provided
    if (params.media && params.media.length > 0) {
      bufferParams.media = {
        photo: params.media[0], // Buffer supports one photo per update
      };
    }

    // Add scheduled time
    if (params.scheduledAt && !params.postNow) {
      bufferParams.scheduled_at = Math.floor(params.scheduledAt.getTime() / 1000);
    }

    return this.createPost(bufferParams);
  }

  /**
   * Helper: Get all connected social accounts with their details
   */
  async getConnectedAccounts(): Promise<{
    success: boolean;
    accounts?: Array<{
      id: string;
      platform: string;
      username: string;
      platformId: string;
    }>;
    error?: string;
  }> {
    const result = await this.getProfiles();

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to get profiles',
      };
    }

    return {
      success: true,
      accounts: result.data.map((profile) => ({
        id: profile.id,
        platform: profile.service,
        username: profile.service_username,
        platformId: profile.service_id,
      })),
    };
  }

  /**
   * Helper: Validate Buffer connection
   */
  async validateConnection(): Promise<{ valid: boolean; error?: string }> {
    if (!this.accessToken) {
      return { valid: false, error: 'Buffer access token not configured' };
    }

    const result = await this.getUser();
    return {
      valid: result.success,
      error: result.error,
    };
  }
}

// Export singleton instance
export const bufferService = new BufferService();

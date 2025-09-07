import { sbServer } from '@/lib/supabase/server';

export interface PublishResult {
  success: boolean;
  externalPostId?: string;
  error?: string;
  platformResponse?: any;
}

export interface PublishData {
  content: string;
  mediaUrls: string[];
  scheduledAt?: string;
  metadata?: any;
}

export interface SocialAccount {
  id: string;
  provider: string;
  name: string;
  token_encrypted: string;
  provider_id: string;
  metadata?: any;
}

/**
 * Base class cho tất cả social media publishers
 */
export abstract class BaseSocialPublisher {
  protected account: SocialAccount;

  constructor(account: SocialAccount) {
    this.account = account;
  }

  abstract publish(data: PublishData): Promise<PublishResult>;
  
  protected abstract decryptToken(encryptedToken: string): string;
  
  protected logPublishAttempt(data: PublishData, result: PublishResult) {
    console.log(`[${this.account.provider.toUpperCase()}] Publishing to ${this.account.name}:`, {
      success: result.success,
      externalPostId: result.externalPostId,
      error: result.error
    });
  }
}

/**
 * Facebook Publisher
 */
export class FacebookPublisher extends BaseSocialPublisher {
  protected decryptToken(encryptedToken: string): string {
    // TODO: Implement proper token decryption
    return encryptedToken;
  }

  async publish(data: PublishData): Promise<PublishResult> {
    try {
      const accessToken = this.decryptToken(this.account.token_encrypted);
      const pageId = this.account.provider_id;

      // Chuẩn bị data cho Facebook API
      const postData: any = {
        message: data.content,
        access_token: accessToken
      };

      // Nếu có media, upload và attach
      if (data.mediaUrls && data.mediaUrls.length > 0) {
        // TODO: Implement media upload to Facebook
        // For now, just include the first image URL
        if (data.mediaUrls[0]) {
          postData.link = data.mediaUrls[0];
        }
      }

      // Nếu là scheduled post
      if (data.scheduledAt) {
        const scheduleTime = Math.floor(new Date(data.scheduledAt).getTime() / 1000);
        postData.scheduled_publish_time = scheduleTime;
        postData.published = false;
      }

      // Call Facebook Graph API
      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      const result = await response.json();

      if (response.ok && result.id) {
        const publishResult: PublishResult = {
          success: true,
          externalPostId: result.id,
          platformResponse: result
        };
        this.logPublishAttempt(data, publishResult);
        return publishResult;
      } else {
        const publishResult: PublishResult = {
          success: false,
          error: result.error?.message || 'Facebook API error',
          platformResponse: result
        };
        this.logPublishAttempt(data, publishResult);
        return publishResult;
      }

    } catch (error: any) {
      const publishResult: PublishResult = {
        success: false,
        error: `Facebook publish error: ${error.message}`
      };
      this.logPublishAttempt(data, publishResult);
      return publishResult;
    }
  }
}

/**
 * Instagram Publisher
 */
export class InstagramPublisher extends BaseSocialPublisher {
  protected decryptToken(encryptedToken: string): string {
    // TODO: Implement proper token decryption
    return encryptedToken;
  }

  async publish(data: PublishData): Promise<PublishResult> {
    try {
      const accessToken = this.decryptToken(this.account.token_encrypted);
      const accountId = this.account.provider_id;

      // Instagram requires media for most posts
      if (!data.mediaUrls || data.mediaUrls.length === 0) {
        return {
          success: false,
          error: 'Instagram posts require at least one image or video'
        };
      }

      // Step 1: Create media container
      const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${accountId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: data.mediaUrls[0],
          caption: data.content,
          access_token: accessToken
        })
      });

      const mediaResult = await mediaResponse.json();
      
      if (!mediaResponse.ok || !mediaResult.id) {
        const publishResult: PublishResult = {
          success: false,
          error: mediaResult.error?.message || 'Instagram media creation failed',
          platformResponse: mediaResult
        };
        this.logPublishAttempt(data, publishResult);
        return publishResult;
      }

      // Step 2: Publish the media
      const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${accountId}/media_publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: mediaResult.id,
          access_token: accessToken
        })
      });

      const publishResult = await publishResponse.json();

      if (publishResponse.ok && publishResult.id) {
        const result: PublishResult = {
          success: true,
          externalPostId: publishResult.id,
          platformResponse: publishResult
        };
        this.logPublishAttempt(data, result);
        return result;
      } else {
        const result: PublishResult = {
          success: false,
          error: publishResult.error?.message || 'Instagram publish failed',
          platformResponse: publishResult
        };
        this.logPublishAttempt(data, result);
        return result;
      }

    } catch (error: any) {
      const publishResult: PublishResult = {
        success: false,
        error: `Instagram publish error: ${error.message}`
      };
      this.logPublishAttempt(data, publishResult);
      return publishResult;
    }
  }
}

/**
 * Zalo Publisher
 */
export class ZaloPublisher extends BaseSocialPublisher {
  protected decryptToken(encryptedToken: string): string {
    // TODO: Implement proper token decryption
    return encryptedToken;
  }

  async publish(data: PublishData): Promise<PublishResult> {
    try {
      const accessToken = this.decryptToken(this.account.token_encrypted);
      const oaId = this.account.provider_id;

      // Chuẩn bị data cho Zalo OA API
      const postData: any = {
        message: {
          text: data.content
        }
      };

      // Nếu có media, attach vào message
      if (data.mediaUrls && data.mediaUrls.length > 0) {
        postData.message.attachment = {
          type: 'template',
          payload: {
            template_type: 'media',
            elements: data.mediaUrls.map(url => ({
              media_type: 'image',
              url: url
            }))
          }
        };
      }

      // Call Zalo OA API
      const response = await fetch(`https://openapi.zalo.me/v3.0/oa/message/cs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': accessToken
        },
        body: JSON.stringify(postData)
      });

      const result = await response.json();

      if (response.ok && result.error === 0) {
        const publishResult: PublishResult = {
          success: true,
          externalPostId: result.data?.message_id || `zalo_${Date.now()}`,
          platformResponse: result
        };
        this.logPublishAttempt(data, publishResult);
        return publishResult;
      } else {
        const publishResult: PublishResult = {
          success: false,
          error: result.message || 'Zalo OA API error',
          platformResponse: result
        };
        this.logPublishAttempt(data, publishResult);
        return publishResult;
      }

    } catch (error: any) {
      const publishResult: PublishResult = {
        success: false,
        error: `Zalo publish error: ${error.message}`
      };
      this.logPublishAttempt(data, publishResult);
      return publishResult;
    }
  }
}

/**
 * Factory function để tạo publisher theo provider
 */
export function createPublisher(account: SocialAccount): BaseSocialPublisher {
  switch (account.provider) {
    case 'facebook':
      return new FacebookPublisher(account);
    case 'instagram':
      return new InstagramPublisher(account);
    case 'zalo':
      return new ZaloPublisher(account);
    default:
      throw new Error(`Unsupported provider: ${account.provider}`);
  }
}

/**
 * Log publish activity
 */
export async function logPublishActivity(
  postId: string,
  scheduleId: string,
  account: SocialAccount,
  result: PublishResult,
  userId?: string
) {
  const sb = sbServer(true);
  
  const status = result.success ? 'success' : 'failed';
  const description = result.success 
    ? `Đăng bài thành công lên ${account.provider}: ${account.name}`
    : `Đăng bài thất bại lên ${account.provider}: ${account.name} - ${result.error}`;

  try {
    await sb.from('autopostvn_system_activity_logs').insert({
      user_id: userId,
      action_type: 'post_published',
      action_category: 'post',
      description,
      status,
      target_resource_type: 'post',
      target_resource_id: postId,
      additional_data: {
        schedule_id: scheduleId,
        social_account_id: account.id,
        provider: account.provider,
        external_post_id: result.externalPostId,
        error: result.error,
        platform_response: result.platformResponse,
        publish_timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to log publish activity:', error);
  }
}

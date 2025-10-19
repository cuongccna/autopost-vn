import { sbServer } from '@/lib/supabase/server';
import { OAuthTokenManager } from '@/lib/services/TokenEncryptionService';

export interface PublishResult {
  success: boolean;
  externalPostId?: string;
  error?: string;
  platformResponse?: any;
  metadata?: any;
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

  /**
   * Perform fetch with timeout and basic retries for transient failures
   */
  protected async fetchWithRetry(
    url: string,
    init: { method?: string; headers?: Record<string, string>; body?: any; timeoutMs?: number } = {}
  ): Promise<Response> {
    const {
      timeoutMs = 15000,
      ...rest
    } = init;

    const maxAttempts = 3;
    let attempt = 0;
    let lastError: any;

    while (attempt < maxAttempts) {
      attempt++;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...(rest as any), signal: controller.signal } as any);
        clearTimeout(timeout);

        // Retry on 429/5xx
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          const backoff = 500 * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }
        return res;
      } catch (e) {
        clearTimeout(timeout);
        lastError = e;
        // Retry on abort/network
        if (attempt < maxAttempts) {
          const backoff = 500 * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }
      }
    }
    throw lastError || new Error('Network error');
  }
}

/**
 * Facebook Publisher
 */
export class FacebookPublisher extends BaseSocialPublisher {
  protected decryptToken(encryptedToken: string): string {
    return OAuthTokenManager.decryptForUse(encryptedToken);
  }

  async publish(data: PublishData): Promise<PublishResult> {
    try {
      const accessToken = this.decryptToken(this.account.token_encrypted);
      const pageId = this.account.provider_id;

      console.log('🔵 Facebook Publisher - Starting publish process:', {
        pageId,
        hasMedia: data.mediaUrls && data.mediaUrls.length > 0,
        isScheduled: !!data.scheduledAt
      });

      // Handle media upload first if present
      let uploadedMediaIds: string[] = [];
      if (data.mediaUrls && data.mediaUrls.length > 0) {
        console.log('📸 Uploading media to Facebook...');
        // Limit concurrent uploads to 3
        const concurrency = 3;
        let index = 0;
        const results: string[] = [];
        const uploadNext = async () => {
          while (index < data.mediaUrls!.length) {
            const current = index++;
            const mediaUrl = data.mediaUrls![current];
            try {
              const mediaId = await this.uploadMediaToFacebook(mediaUrl, accessToken, pageId);
              if (mediaId) results.push(mediaId);
            } catch (err) {
              console.error('Media upload failed:', err);
            }
          }
        };
        await Promise.all(new Array(Math.min(concurrency, data.mediaUrls.length)).fill(0).map(() => uploadNext()));
        uploadedMediaIds = results;
      }

      // Prepare post data
      const postData: any = {
        message: data.content,
        access_token: accessToken
      };

      // Attach uploaded media
      if (uploadedMediaIds.length > 0) {
        if (uploadedMediaIds.length === 1) {
          // Single photo post
          postData.object_attachment = uploadedMediaIds[0];
        } else {
          // Multiple photos post
          postData.attached_media = uploadedMediaIds.map(id => ({ media_fbid: id }));
        }
      }

      // Handle scheduling
      if (data.scheduledAt) {
        const scheduleTime = Math.floor(new Date(data.scheduledAt).getTime() / 1000);
        const now = Math.floor(Date.now() / 1000);
        
        // Facebook requires scheduled time to be at least 10 minutes in the future
        if (scheduleTime > now + 600) {
          postData.scheduled_publish_time = scheduleTime;
          postData.published = false;
          console.log('⏰ Scheduling post for:', new Date(data.scheduledAt));
        } else {
          console.log('⚠️ Schedule time too close, publishing immediately');
        }
      }

      // Determine API endpoint
      const endpoint = uploadedMediaIds.length > 0 
        ? `https://graph.facebook.com/v18.0/${pageId}/photos`
        : `https://graph.facebook.com/v18.0/${pageId}/feed`;

      console.log('🚀 Calling Facebook API:', endpoint);

      // Call Facebook Graph API
      const response = await this.fetchWithRetry(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
        timeoutMs: 15000
      });

      const result = await response.json();
      
      console.log('📡 Facebook API Response:', {
        status: response.status,
        success: response.ok,
        data: result
      });

      if (response.ok && result.id) {
        const publishResult: PublishResult = {
          success: true,
          externalPostId: result.id,
          platformResponse: result,
          metadata: {
            uploadedMedia: uploadedMediaIds,
            endpoint: endpoint,
            scheduled: !!postData.scheduled_publish_time
          }
        };
        this.logPublishAttempt(data, publishResult);
        return publishResult;
      } else {
        // Handle Facebook API errors
        const errorMessage = this.getFacebookErrorMessage(result);
        const publishResult: PublishResult = {
          success: false,
          error: errorMessage,
          platformResponse: result
        };
        this.logPublishAttempt(data, publishResult);
        return publishResult;
      }

    } catch (error: any) {
      console.error('🔴 Facebook Publisher Error:', error);
      const publishResult: PublishResult = {
        success: false,
        error: `Facebook publish error: ${error.message}`
      };
      this.logPublishAttempt(data, publishResult);
      return publishResult;
    }
  }

  /**
   * Upload media to Facebook and return media ID
   */
  private async uploadMediaToFacebook(mediaUrl: string, accessToken: string, pageId: string): Promise<string | null> {
    try {
      console.log('📤 Uploading media:', mediaUrl);

      // For external URLs, use url parameter
      const uploadData = {
        url: mediaUrl,
        access_token: accessToken,
        published: false // Unpublished photo for later use in post
      };

      const response = await this.fetchWithRetry(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData),
        timeoutMs: 20000
      });

      const result = await response.json();

      if (response.ok && result.id) {
        console.log('✅ Media uploaded successfully:', result.id);
        return result.id;
      } else {
        console.error('❌ Media upload failed:', result);
        return null;
      }
    } catch (error) {
      console.error('❌ Media upload error:', error);
      return null;
    }
  }

  /**
   * Parse Facebook API error messages
   */
  private getFacebookErrorMessage(result: any): string {
    if (result.error) {
      const { message, code, error_user_title, error_user_msg } = result.error;
      
      // Common Facebook error codes
      switch (code) {
        case 190:
          return 'Token Facebook đã hết hạn. Vui lòng kết nối lại tài khoản.';
        case 200:
          return 'Không có quyền đăng bài lên trang này. Vui lòng kiểm tra quyền admin.';
        case 368:
          return 'Tạm thời không thể đăng bài. Trang Facebook có thể bị hạn chế.';
        case 506:
          return 'Nội dung bài viết vi phạm chính sách của Facebook.';
        case 1500:
          return 'Không thể đăng bài vào thời điểm này. Vui lòng thử lại sau.';
        default:
          return error_user_msg || message || 'Lỗi không xác định từ Facebook API.';
      }
    }
    
    return 'Lỗi không xác định khi đăng bài lên Facebook.';
  }
}

/**
 * Instagram Publisher
 */
export class InstagramPublisher extends BaseSocialPublisher {
  protected decryptToken(encryptedToken: string): string {
    return OAuthTokenManager.decryptForUse(encryptedToken);
  }

  async publish(data: PublishData): Promise<PublishResult> {
    try {
      const accessToken = this.decryptToken(this.account.token_encrypted);
      const accountId = this.account.provider_id;

      console.log('📸 Instagram Publisher - Starting publish process:', {
        accountId,
        mediaCount: data.mediaUrls?.length || 0,
        isScheduled: !!data.scheduledAt
      });

      // Instagram requires media for posts
      if (!data.mediaUrls || data.mediaUrls.length === 0) {
        return {
          success: false,
          error: 'Instagram posts require at least one image or video'
        };
      }

      // Handle single vs multiple media
      if (data.mediaUrls.length === 1) {
        return await this.publishSingleMedia(data, accessToken, accountId);
      } else {
        return await this.publishCarousel(data, accessToken, accountId);
      }

    } catch (error: any) {
      console.error('🔴 Instagram Publisher Error:', error);
      const publishResult: PublishResult = {
        success: false,
        error: `Instagram publish error: ${error.message}`
      };
      this.logPublishAttempt(data, publishResult);
      return publishResult;
    }
  }

  /**
   * Publish single media post
   */
  private async publishSingleMedia(data: PublishData, accessToken: string, accountId: string): Promise<PublishResult> {
    try {
      console.log('📷 Publishing single media to Instagram...');

      // Step 1: Create media container
      const mediaData: any = {
        image_url: data.mediaUrls[0],
        caption: data.content,
        access_token: accessToken
      };

      // Detect if it's a video (basic check)
      const isVideo = this.isVideoUrl(data.mediaUrls[0]);
      if (isVideo) {
        mediaData.media_type = 'VIDEO';
        delete mediaData.image_url;
        mediaData.video_url = data.mediaUrls[0];
      }

      const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${accountId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediaData)
      });

      const mediaResult = await mediaResponse.json();
      
      if (!mediaResponse.ok || !mediaResult.id) {
        const publishResult: PublishResult = {
          success: false,
          error: this.getInstagramErrorMessage(mediaResult),
          platformResponse: mediaResult
        };
        this.logPublishAttempt(data, publishResult);
        return publishResult;
      }

      console.log('✅ Media container created:', mediaResult.id);

      // Step 2: Wait for media processing (for videos)
      if (isVideo) {
        await this.waitForMediaProcessing(mediaResult.id, accessToken);
      }

      // Step 3: Publish the media
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
          platformResponse: publishResult,
          metadata: {
            mediaType: isVideo ? 'video' : 'image',
            mediaContainerId: mediaResult.id
          }
        };
        this.logPublishAttempt(data, result);
        return result;
      } else {
        const result: PublishResult = {
          success: false,
          error: this.getInstagramErrorMessage(publishResult),
          platformResponse: publishResult
        };
        this.logPublishAttempt(data, result);
        return result;
      }

    } catch (error: any) {
      const publishResult: PublishResult = {
        success: false,
        error: `Instagram single media error: ${error.message}`
      };
      this.logPublishAttempt(data, publishResult);
      return publishResult;
    }
  }

  /**
   * Publish carousel post (multiple media)
   */
  private async publishCarousel(data: PublishData, accessToken: string, accountId: string): Promise<PublishResult> {
    try {
      console.log('🎠 Publishing carousel to Instagram...');

      // Step 1: Create media containers for each item
      const mediaContainerIds: string[] = [];

      for (const [index, mediaUrl] of data.mediaUrls.entries()) {
        const isVideo = this.isVideoUrl(mediaUrl);
        const mediaData: any = {
          is_carousel_item: true,
          access_token: accessToken
        };

        if (isVideo) {
          mediaData.media_type = 'VIDEO';
          mediaData.video_url = mediaUrl;
        } else {
          mediaData.image_url = mediaUrl;
        }

        const response = await fetch(`https://graph.facebook.com/v18.0/${accountId}/media`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mediaData)
        });

        const result = await response.json();
        
        if (response.ok && result.id) {
          mediaContainerIds.push(result.id);
          console.log(`✅ Carousel item ${index + 1} created:`, result.id);
          
          // Wait for video processing
          if (isVideo) {
            await this.waitForMediaProcessing(result.id, accessToken);
          }
        } else {
          console.error(`❌ Failed to create carousel item ${index + 1}:`, result);
        }
      }

      if (mediaContainerIds.length === 0) {
        return {
          success: false,
          error: 'Failed to create any media containers for carousel'
        };
      }

      // Step 2: Create carousel container
      const carouselResponse = await fetch(`https://graph.facebook.com/v18.0/${accountId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media_type: 'CAROUSEL',
          children: mediaContainerIds.join(','),
          caption: data.content,
          access_token: accessToken
        })
      });

      const carouselResult = await carouselResponse.json();

      if (!carouselResponse.ok || !carouselResult.id) {
        return {
          success: false,
          error: this.getInstagramErrorMessage(carouselResult),
          platformResponse: carouselResult
        };
      }

      console.log('🎠 Carousel container created:', carouselResult.id);

      // Step 3: Publish the carousel
      const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${accountId}/media_publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: carouselResult.id,
          access_token: accessToken
        })
      });

      const publishResult = await publishResponse.json();

      if (publishResponse.ok && publishResult.id) {
        const result: PublishResult = {
          success: true,
          externalPostId: publishResult.id,
          platformResponse: publishResult,
          metadata: {
            mediaType: 'carousel',
            carouselContainerId: carouselResult.id,
            mediaContainerIds: mediaContainerIds,
            itemCount: mediaContainerIds.length
          }
        };
        this.logPublishAttempt(data, result);
        return result;
      } else {
        const result: PublishResult = {
          success: false,
          error: this.getInstagramErrorMessage(publishResult),
          platformResponse: publishResult
        };
        this.logPublishAttempt(data, result);
        return result;
      }

    } catch (error: any) {
      const publishResult: PublishResult = {
        success: false,
        error: `Instagram carousel error: ${error.message}`
      };
      this.logPublishAttempt(data, publishResult);
      return publishResult;
    }
  }

  /**
   * Wait for media processing to complete (especially for videos)
   */
  private async waitForMediaProcessing(mediaId: string, accessToken: string): Promise<void> {
    const maxAttempts = 10;
    const delay = 2000; // 2 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${mediaId}?fields=status_code&access_token=${accessToken}`);
        const result = await response.json();

        if (result.status_code === 'FINISHED') {
          console.log('✅ Media processing completed');
          return;
        } else if (result.status_code === 'ERROR') {
          throw new Error('Media processing failed');
        }

        console.log(`⏳ Media processing... (${attempt + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        console.error('Error checking media status:', error);
        break;
      }
    }
  }

  /**
   * Check if URL is a video based on file extension
   */
  private isVideoUrl(url: string): boolean {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv'];
    const urlLower = url.toLowerCase();
    return videoExtensions.some(ext => urlLower.includes(ext));
  }

  /**
   * Parse Instagram API error messages
   */
  private getInstagramErrorMessage(result: any): string {
    if (result.error) {
      const { message, code, error_user_title, error_user_msg } = result.error;
      
      // Common Instagram error codes
      switch (code) {
        case 190:
          return 'Token Instagram đã hết hạn. Vui lòng kết nối lại tài khoản.';
        case 100:
          return 'Thông số không hợp lệ. Vui lòng kiểm tra lại nội dung và hình ảnh.';
        case 9007:
          return 'Tài khoản Instagram không có quyền đăng bài. Cần chuyển sang Business/Creator account.';
        case 9004:
          return 'Nội dung hoặc hình ảnh vi phạm chính sách của Instagram.';
        case 36000:
          return 'Đã đạt giới hạn số lượng bài đăng trong ngày.';
        default:
          return error_user_msg || message || 'Lỗi không xác định từ Instagram API.';
      }
    }
    
    return 'Lỗi không xác định khi đăng bài lên Instagram.';
  }
}

/**
 * Zalo Publisher
 */
export class ZaloPublisher extends BaseSocialPublisher {
  protected decryptToken(encryptedToken: string): string {
    return OAuthTokenManager.decryptForUse(encryptedToken);
  }

  async publish(data: PublishData): Promise<PublishResult> {
    try {
      const accessToken = this.decryptToken(this.account.token_encrypted);
      const oaId = this.account.provider_id;

      console.log('📱 Zalo Publisher - Starting publish process:', {
        oaId,
        hasMedia: data.mediaUrls && data.mediaUrls.length > 0,
        isScheduled: !!data.scheduledAt
      });

      // Zalo OA supports different message types
      let messageData: any;

      if (data.mediaUrls && data.mediaUrls.length > 0) {
        // Media message
        if (data.mediaUrls.length === 1) {
          messageData = await this.createSingleMediaMessage(data, accessToken, oaId);
        } else {
          messageData = await this.createCarouselMessage(data, accessToken, oaId);
        }
      } else {
        // Text only message
        messageData = {
          recipient: {
            user_id: "broadcast" // For OA broadcast
          },
          message: {
            text: data.content
          }
        };
      }

      // Handle scheduled posting (if supported by Zalo)
      if (data.scheduledAt) {
        console.log('⚠️ Zalo scheduled posting not fully supported, publishing immediately');
      }

      // Send message via Zalo OA API
      const response = await fetch(`https://openapi.zalo.me/v3.0/oa/message/cs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': accessToken
        },
        body: JSON.stringify(messageData)
      });

      const result = await response.json();

      console.log('📡 Zalo API Response:', {
        status: response.status,
        success: response.ok && result.error === 0,
        data: result
      });

      if (response.ok && result.error === 0) {
        const publishResult: PublishResult = {
          success: true,
          externalPostId: result.data?.message_id || `zalo_${Date.now()}`,
          platformResponse: result,
          metadata: {
            messageType: data.mediaUrls?.length > 0 ? 'media' : 'text',
            oaId: oaId
          }
        };
        this.logPublishAttempt(data, publishResult);
        return publishResult;
      } else {
        const publishResult: PublishResult = {
          success: false,
          error: this.getZaloErrorMessage(result),
          platformResponse: result
        };
        this.logPublishAttempt(data, publishResult);
        return publishResult;
      }

    } catch (error: any) {
      console.error('🔴 Zalo Publisher Error:', error);
      const publishResult: PublishResult = {
        success: false,
        error: `Zalo publish error: ${error.message}`
      };
      this.logPublishAttempt(data, publishResult);
      return publishResult;
    }
  }

  /**
   * Create single media message for Zalo
   */
  private async createSingleMediaMessage(data: PublishData, accessToken: string, oaId: string): Promise<any> {
    const mediaUrl = data.mediaUrls[0];
    const isImage = this.isImageUrl(mediaUrl);

    if (isImage) {
      return {
        recipient: {
          user_id: "broadcast"
        },
        message: {
          attachment: {
            type: "image",
            payload: {
              url: mediaUrl,
              caption: data.content
            }
          }
        }
      };
    } else {
      // For files or other media types
      return {
        recipient: {
          user_id: "broadcast"
        },
        message: {
          attachment: {
            type: "file",
            payload: {
              url: mediaUrl
            }
          },
          text: data.content
        }
      };
    }
  }

  /**
   * Create carousel/gallery message for Zalo
   */
  private async createCarouselMessage(data: PublishData, accessToken: string, oaId: string): Promise<any> {
    return {
      recipient: {
        user_id: "broadcast"
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "list",
            elements: data.mediaUrls.slice(0, 4).map((url, index) => ({
              title: `Hình ${index + 1}`,
              image_url: url,
              subtitle: index === 0 ? data.content : ""
            }))
          }
        }
      }
    };
  }

  /**
   * Check if URL is an image
   */
  private isImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const urlLower = url.toLowerCase();
    return imageExtensions.some(ext => urlLower.includes(ext));
  }

  /**
   * Parse Zalo API error messages
   */
  private getZaloErrorMessage(result: any): string {
    if (result.error && result.error !== 0) {
      const errorCode = result.error;
      const message = result.message;

      // Common Zalo error codes
      switch (errorCode) {
        case -124:
          return 'Token Zalo đã hết hạn. Vui lòng kết nối lại tài khoản.';
        case -201:
          return 'OA chưa được phê duyệt hoặc bị khóa.';
        case -213:
          return 'Không có quyền gửi tin nhắn tới người dùng này.';
        case -214:
          return 'Nội dung tin nhắn vi phạm chính sách của Zalo.';
        case -216:
          return 'Đã đạt giới hạn số lượng tin nhắn trong ngày.';
        case -232:
          return 'File đính kèm không hợp lệ hoặc quá lớn.';
        default:
          return message || `Lỗi Zalo API: ${errorCode}`;
      }
    }
    
    return 'Lỗi không xác định khi gửi tin nhắn Zalo.';
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

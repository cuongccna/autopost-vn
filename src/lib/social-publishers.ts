import { query } from '@/lib/db/postgres';
import { OAuthTokenManager } from '@/lib/services/TokenEncryptionService';
import { withRateLimit, checkRateLimit } from '@/lib/utils/rateLimiter';
import logger, { loggers } from '@/lib/utils/logger';
import crypto from 'crypto';

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
  mediaType?: 'image' | 'video' | 'album' | 'none';
  scheduledAt?: string;
  metadata?: any;
}

export interface SocialAccount {
  id: string;
  provider: string;
  name: string;
  token_encrypted: string;
  provider_id: string;
  workspace_id?: string;
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
      const userId = this.account.workspace_id || this.account.id; // Use workspace_id or fallback to account id

      logger.info('Facebook Publisher - Starting publish process', {
        pageId,
        hasMedia: data.mediaUrls && data.mediaUrls.length > 0,
        mediaType: data.mediaType,
        isScheduled: !!data.scheduledAt,
        userId
      });

      // Check rate limit before proceeding
      const rateLimitCheck = await checkRateLimit('facebook', userId);
      if (!rateLimitCheck.allowed) {
        const errorMsg = `Rate limit exceeded. ${rateLimitCheck.remaining} requests remaining. Resets at ${rateLimitCheck.resetAt.toISOString()}`;
        logger.warn('Facebook rate limit exceeded', {
          userId,
          resetAt: rateLimitCheck.resetAt,
          retryAfter: rateLimitCheck.retryAfter
        });
        
        return {
          success: false,
          error: errorMsg,
          metadata: {
            rateLimitExceeded: true,
            resetAt: rateLimitCheck.resetAt,
            retryAfter: rateLimitCheck.retryAfter
          }
        };
      }

      // Log remaining rate limit
      logger.debug('Facebook rate limit check passed', {
        remaining: rateLimitCheck.remaining,
        resetAt: rateLimitCheck.resetAt
      });

      // Handle video post
      if (data.mediaType === 'video' && data.mediaUrls && data.mediaUrls.length > 0) {
        return await this.publishVideoPost(data, accessToken, pageId);
      }

      // Handle media upload first if present (images)
      let uploadedMediaIds: string[] = [];
      if (data.mediaUrls && data.mediaUrls.length > 0) {
        logger.info('Uploading media to Facebook', { count: data.mediaUrls.length });
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
      // Always use feed endpoint when attaching media IDs (since we already uploaded them as unpublished)
      const endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;

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
      
      // Validate URL is publicly accessible
      if (mediaUrl.includes('localhost') || mediaUrl.includes('127.0.0.1') || mediaUrl.includes('192.168.')) {
        const isProduction = process.env.NODE_ENV === 'production';
        const warningMsg = `⚠️ ${isProduction ? 'ERROR' : 'WARNING'}: Using local URL (${mediaUrl}) - Facebook cannot access localhost URLs`;
        
        if (isProduction) {
          console.error(warningMsg);
          return null;
        } else {
          console.warn(warningMsg);
          console.warn('💡 This will work when deployed to VPS with public domain');
        }
      }

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
   * Publish video post to Facebook Page
   */
  private async publishVideoPost(data: PublishData, accessToken: string, pageId: string): Promise<PublishResult> {
    try {
      console.log('🎥 Publishing video post to Facebook');

      const videoUrl = data.mediaUrls![0]; // Take first video

      const postData: any = {
        description: data.content,
        file_url: videoUrl,
        access_token: accessToken
      };

      // Handle scheduling for video
      if (data.scheduledAt) {
        const scheduleTime = Math.floor(new Date(data.scheduledAt).getTime() / 1000);
        const now = Math.floor(Date.now() / 1000);
        
        if (scheduleTime > now + 600) {
          postData.scheduled_publish_time = scheduleTime;
          postData.published = false;
          console.log('⏰ Scheduling video for:', new Date(data.scheduledAt));
        }
      }

      const endpoint = `https://graph.facebook.com/v18.0/${pageId}/videos`;
      console.log('🚀 Calling Facebook Video API:', endpoint);

      const response = await this.fetchWithRetry(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
        timeoutMs: 30000 // Videos need more time
      });

      const result = await response.json();
      
      console.log('📡 Facebook Video API Response:', {
        status: response.status,
        success: response.ok,
        data: result
      });

      if (response.ok && result.id) {
        return {
          success: true,
          externalPostId: result.id,
          platformResponse: result,
          metadata: {
            mediaType: 'video',
            endpoint: endpoint,
            scheduled: !!postData.scheduled_publish_time
          }
        };
      } else {
        const errorMessage = this.getFacebookErrorMessage(result);
        return {
          success: false,
          error: errorMessage,
          platformResponse: result
        };
      }
    } catch (error: any) {
      console.error('🔴 Facebook Video Publisher Error:', error);
      return {
        success: false,
        error: `Facebook video publish error: ${error.message}`
      };
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

      // Validate media URL
      const mediaUrl = data.mediaUrls[0];
      if (!mediaUrl || !mediaUrl.startsWith('http')) {
        return {
          success: false,
          error: 'Invalid media URL. URL must be publicly accessible and start with http/https.'
        };
      }

      // Detect if it's a video (basic check)
      const isVideo = this.isVideoUrl(mediaUrl);

      console.log('🔍 Media validation:', {
        url: mediaUrl,
        isVideo,
        isPublic: mediaUrl.startsWith('http'),
        urlLength: mediaUrl.length
      });

      // Step 1: Create media container
      const mediaData: any = {
        image_url: mediaUrl,
        caption: data.content,
        access_token: accessToken
      };

      if (isVideo) {
        // ✅ Instagram now requires REELS for video content (2024+ API change)
        // VIDEO media_type has been deprecated and no longer supported
        mediaData.media_type = 'REELS';
        delete mediaData.image_url;
        mediaData.video_url = mediaUrl;
        // Optional: share to main feed as well as Reels tab
        mediaData.share_to_feed = true;
        
        console.log('🎬 Preparing REELS container:', {
          video_url: mediaUrl,
          media_type: 'REELS',
          share_to_feed: true
        });
      } else {
        console.log('🖼️ Preparing IMAGE container:', {
          image_url: mediaUrl
        });
      }

      console.log('📤 Creating Instagram media container...', {
        accountId,
        mediaType: isVideo ? 'REELS' : 'IMAGE',
        hasCaption: !!data.content
      });

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

      // Step 2: Wait for media processing (ALWAYS check status, not just for videos)
      // Instagram may process images too, especially large ones
      console.log('🔍 Checking media container status before publishing...');
      await this.waitForMediaProcessing(mediaResult.id, accessToken);

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
          // ✅ Updated Nov 2025: Use REELS for all video content including carousel items
          // Instagram API now requires REELS for better compatibility
          mediaData.media_type = 'REELS';
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

      // Step 3: Wait for carousel processing
      console.log('🔍 Checking carousel container status before publishing...');
      await this.waitForMediaProcessing(carouselResult.id, accessToken);

      // Step 4: Publish the carousel
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
   * Wait for media processing to complete and check status
   * Status codes: FINISHED, IN_PROGRESS, ERROR, EXPIRED
   */
  private async waitForMediaProcessing(mediaId: string, accessToken: string): Promise<void> {
    const maxAttempts = 60; // Increased to 120 seconds (2 minutes) for large videos/images
    const delay = 2000; // 2 seconds per attempt

    console.log(`🔍 Checking media container status: ${mediaId}`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${mediaId}?fields=status_code,status&access_token=${accessToken}`);
        const result = await response.json();

        // Log full response for debugging
        console.log(`📊 Container status response:`, JSON.stringify(result, null, 2));

        const statusCode = result.status_code || result.status;

        switch (statusCode) {
          case 'FINISHED':
            console.log('✅ Media processing completed - Ready to publish');
            return;
          
          case 'ERROR':
            // Get detailed error information
            const errorMsg = result.error?.message 
              || result.error_message 
              || result.message 
              || 'Media processing failed - Unknown error';
            const errorCode = result.error?.code || result.error_code;
            const errorSubcode = result.error?.error_subcode || result.error_subcode;
            
            console.error('❌ Media processing error:', {
              message: errorMsg,
              code: errorCode,
              subcode: errorSubcode,
              fullResponse: result
            });
            
            // Return more helpful error message
            throw new Error(`Instagram media processing failed: ${errorMsg}${errorCode ? ` (Code: ${errorCode})` : ''}`);
          
          case 'EXPIRED':
            console.error('⏰ Media container expired (>24 hours)');
            throw new Error('Media container expired. Please try uploading again.');
          
          case 'IN_PROGRESS':
            console.log(`⏳ Media processing in progress... (${attempt + 1}/${maxAttempts}) - ${(attempt * 2)}s elapsed`);
            break;
          
          default:
            console.log(`⏳ Waiting for media status... Current: ${statusCode} (${attempt + 1}/${maxAttempts})`);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error: any) {
        if (error.message.includes('expired') || error.message.includes('failed')) {
          throw error; // Re-throw processing errors
        }
        console.error('⚠️ Error checking media status:', error.message);
        // Continue checking on network errors
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        break;
      }
    }

    // If we exit the loop without FINISHED status, throw error instead of continuing
    console.error('❌ Media processing timeout after 120 seconds');
    throw new Error('Media processing timeout. Instagram may be experiencing delays. Please try again later.');
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
      const { message, code, error_user_title, error_user_msg, error_subcode } = result.error;
      
      // Common Instagram error codes
      switch (code) {
        case 190:
          return 'Token Instagram đã hết hạn. Vui lòng kết nối lại tài khoản.';
        case 100:
          // Check for specific subcodes
          if (error_subcode === 2207067) {
            return 'Instagram không còn hỗ trợ media_type VIDEO. Vui lòng cập nhật app để sử dụng REELS cho video.';
          }
          return error_user_msg || 'Thông số không hợp lệ. Vui lòng kiểm tra lại nội dung và hình ảnh.';
        case -1:
          // Transcoding errors
          if (error_subcode === 2207082) {
            return 'Video không đúng định dạng Instagram yêu cầu. Vui lòng re-encode video với: H.264 codec, AAC audio, MP4 container, progressive scan (không interlaced), max 1080p, max 5Mbps bitrate. Dùng ffmpeg: ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 128k -movflags +faststart -pix_fmt yuv420p -vf "scale=\'min(1920,iw)\':\'min(1080,ih)\':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2" output.mp4';
          }
          return error_user_msg || error_user_title || 'Lỗi xử lý media từ Instagram.';
        case 9007:
          // Media processing errors
          if (error_subcode === 2207027) {
            return 'Media chưa sẵn sàng để đăng. Hệ thống sẽ tự động thử lại sau ít phút. Lỗi này thường do video/ảnh đang được Instagram xử lý.';
          }
          return error_user_msg || 'Tài khoản Instagram không có quyền đăng bài. Cần chuyển sang Business/Creator account.';
        case 9004:
          return 'Nội dung hoặc hình ảnh vi phạm chính sách của Instagram.';
        case 36000:
          return 'Đã đạt giới hạn số lượng bài đăng trong ngày.';
        case 10:
          return 'Thiếu quyền truy cập. Vui lòng kết nối lại tài khoản Instagram với đầy đủ permissions.';
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

      console.log('📱 Zalo Publisher - Starting publish process (Article/Feed):', {
        oaId,
        hasMedia: data.mediaUrls && data.mediaUrls.length > 0,
        isScheduled: !!data.scheduledAt
      });

      // Prepare Article Data for Zalo Feed
      // Zalo OA uses "Articles" for feed posts
      const articleData: any = {
        type: "normal",
        title: data.content.length > 50 ? data.content.substring(0, 47) + "..." : (data.content || "Bài viết mới"),
        author: this.account.name || "AutoPostVN",
        cover: {
          cover_type: "photo",
          photo_url: data.mediaUrls?.[0] || "https://stc-zaloprofile.zdn.vn/pc/v1/images/zalo_share_logo.png",
          status: "show"
        },
        body: [
          {
            type: "text",
            content: data.content || " "
          }
        ]
      };

      // Add images to body if multiple or if single image (to ensure it's in body too)
      if (data.mediaUrls && data.mediaUrls.length > 0) {
        // If single image, it's already cover, but maybe add to body too?
        // Let's add all images to body for completeness
        data.mediaUrls.forEach(url => {
           articleData.body.push({
             type: "image",
             content: url,
             caption: ""
           });
        });
      }

      // Handle scheduled posting (if supported by Zalo)
      if (data.scheduledAt) {
        console.log('⚠️ Zalo scheduled posting not fully supported via API, publishing immediately');
      }

      // Generate appsecret_proof for Zalo API security
      const appSecret = process.env.ZALO_APP_SECRET;
      let appsecretProof = null;
      
      if (appSecret) {
        try {
          appsecretProof = crypto
            .createHmac('sha256', appSecret)
            .update(accessToken)
            .digest('hex');
        } catch (e) {
          console.error('Failed to generate appsecret_proof:', e);
        }
      } else {
        console.warn('ZALO_APP_SECRET not configured, skipping appsecret_proof');
      }

      console.log('Zalo Publish Debug:', {
        hasSecret: !!appSecret,
        secretPrefix: appSecret ? appSecret.substring(0, 3) + '...' : 'N/A',
        hasProof: !!appsecretProof
      });

      // Zalo API v2.0 Article Create
      const response = await fetch(`https://openapi.zalo.me/v2.0/article/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': accessToken,
          ...(appsecretProof ? { 'appsecret_proof': appsecretProof } : {})
        },
        body: JSON.stringify(articleData)
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
          externalPostId: result.data?.token || result.data?.id || `zalo_article_${Date.now()}`,
          platformResponse: result,
          metadata: {
            messageType: 'article',
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
   * Create single media message for Zalo (Deprecated)
   */
  private async createSingleMediaMessage(data: PublishData, accessToken: string, oaId: string): Promise<any> {
    // Kept for reference but unused
    return {};
  }

  /**
   * Create carousel/gallery message for Zalo (Deprecated)
   */
  private async createCarouselMessage(data: PublishData, accessToken: string, oaId: string): Promise<any> {
    // Kept for reference but unused
    return {};
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
    case 'facebook_page': // 🔥 Facebook Pages use same publisher as Facebook
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
  const status = result.success ? 'success' : 'failed';
  const description = result.success 
    ? `Đăng bài thành công lên ${account.provider}: ${account.name}`
    : `Đăng bài thất bại lên ${account.provider}: ${account.name} - ${result.error}`;

  try {
    await query(`
      INSERT INTO autopostvn_system_activity_logs (
        user_id, action_type, action_category, description, status,
        target_resource_type, target_resource_id, additional_data, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      userId,
      'post_published',
      'post',
      description,
      status,
      'post',
      postId,
      JSON.stringify({
        schedule_id: scheduleId,
        social_account_id: account.id,
        provider: account.provider,
        external_post_id: result.externalPostId,
        error: result.error,
        platform_response: result.platformResponse,
        publish_timestamp: new Date().toISOString()
      })
    ]);
  } catch (error) {
    console.error('Failed to log publish activity:', error);
  }
}

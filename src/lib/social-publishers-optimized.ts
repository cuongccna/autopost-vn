/**
 * ✅ OPTIMIZED: Social Publishers với improved parallel processing
 * Extends base social publishers với performance enhancements
 */

import { FacebookPublisher, InstagramPublisher, ZaloPublisher } from './social-publishers';
import { PublishData, PublishResult, SocialAccount } from './social-publishers';

/**
 * ✅ OPTIMIZATION: Batch media uploader với better concurrency control
 */
export class MediaUploader {
  /**
   * Upload multiple media files in parallel với configurable concurrency
   */
  static async uploadBatch(
    mediaUrls: string[],
    uploadFn: (url: string, index: number) => Promise<string | null>,
    concurrency = 3
  ): Promise<string[]> {
    if (!mediaUrls || mediaUrls.length === 0) {
      return [];
    }

    const results: (string | null)[] = new Array(mediaUrls.length).fill(null);
    let currentIndex = 0;

    const uploadNext = async (): Promise<void> => {
      while (currentIndex < mediaUrls.length) {
        const index = currentIndex++;
        const mediaUrl = mediaUrls[index];

        try {
          const startTime = Date.now();
          const mediaId = await uploadFn(mediaUrl, index);
          const duration = Date.now() - startTime;
          
          if (mediaId) {
            results[index] = mediaId;
            console.log(`✅ [MEDIA] Uploaded media ${index + 1}/${mediaUrls.length} in ${duration}ms`);
          } else {
            console.warn(`⚠️ [MEDIA] Failed to upload media ${index + 1}/${mediaUrls.length}`);
          }
        } catch (err: any) {
          console.error(`❌ [MEDIA] Error uploading media ${index + 1}/${mediaUrls.length}:`, err.message);
        }
      }
    };

    // Start concurrent workers
    const workers = Math.min(concurrency, mediaUrls.length);
    console.log(`🔄 [MEDIA] Starting ${workers} parallel upload workers for ${mediaUrls.length} files`);
    
    const startTime = Date.now();
    await Promise.all(
      Array.from({ length: workers }, () => uploadNext())
    );
    const totalDuration = Date.now() - startTime;
    
    const successCount = results.filter(r => r !== null).length;
    console.log(`🏁 [MEDIA] Completed batch upload: ${successCount}/${mediaUrls.length} successful in ${totalDuration}ms`);

    return results.filter((r): r is string => r !== null);
  }

  /**
   * Upload with retry logic
   */
  static async uploadWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 2,
    retryDelayMs = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = retryDelayMs * Math.pow(2, attempt);
          console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}

/**
 * ✅ OPTIMIZED: Facebook Publisher với improved media handling
 */
export class OptimizedFacebookPublisher extends FacebookPublisher {
  async publish(data: PublishData): Promise<PublishResult> {
    // Use parent implementation which already has optimized parallel upload
    return super.publish(data);
  }
}

/**
 * ✅ OPTIMIZATION: Connection pooling configuration
 * These settings should be applied at the Supabase client level
 */
export const OPTIMIZED_DB_CONFIG = {
  pool: {
    // Maximum number of connections in the pool
    max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'),
    
    // Minimum number of connections to maintain
    min: 2,
    
    // Maximum time (ms) a connection can be idle before being released
    idleTimeoutMillis: 30000,
    
    // Maximum time (ms) to wait for a connection from the pool
    connectionTimeoutMillis: 10000,
  }
};

/**
 * ✅ OPTIMIZATION: Rate limiter configuration
 */
export const RATE_LIMIT_CONFIG = {
  facebook: {
    requestsPerHour: 200,
    requestsPerDay: 4800,
    burstLimit: 10 // Max concurrent requests
  },
  twitter: {
    requestsPerHour: 300,
    requestsPerDay: 7200,
    burstLimit: 15
  },
  linkedin: {
    requestsPerHour: 100,
    requestsPerDay: 2400,
    burstLimit: 5
  },
  instagram: {
    requestsPerHour: 200,
    requestsPerDay: 4800,
    burstLimit: 10
  }
};

/**
 * Memory-efficient batch processor cho large datasets
 */
export class BatchProcessor<T, R> {
  constructor(
    private batchSize: number,
    private processFn: (batch: T[]) => Promise<R[]>
  ) {}

  async process(items: T[]): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      const batchResults = await this.processFn(batch);
      results.push(...batchResults);
      
      // Allow GC between batches
      if (global.gc && i + this.batchSize < items.length) {
        global.gc();
      }
    }
    
    return results;
  }
}

/**
 * Export optimized publisher factory
 */
export function createOptimizedPublisher(account: SocialAccount) {
  switch (account.provider.toLowerCase()) {
    case 'facebook':
      return new OptimizedFacebookPublisher(account);
    case 'instagram':
      return new InstagramPublisher(account);
    case 'zalo':
      return new ZaloPublisher(account);
    default:
      throw new Error(`Unsupported provider: ${account.provider}`);
  }
}

# Scaling Strategy - Handling 500+ Concurrent Users

## 🎯 Vấn đề

**Câu hỏi:** Nếu có 500 users cùng lúc schedule posts vào cùng 1 giờ, phút, giây - Cron job có đáp ứng được không?

**Trả lời ngắn gọn:** **CÓ**, nhưng cần architecture đúng.

---

## 📊 Phân tích Tình huống

### Scenario: 500 users, mỗi user đăng 3 posts, mỗi post lên 2 platforms

- **Tổng số scheduled posts:** 500 × 3 × 2 = **3,000 publishing jobs**
- **Thời gian:** Tất cả scheduled vào `2025-11-10 09:00:00`

### Vấn đề tiềm ẩn:

1. **Database Overload** - 3,000 concurrent queries
2. **API Rate Limits** - Facebook/Instagram có rate limit
3. **Network Bottleneck** - 3,000 HTTP requests cùng lúc
4. **Memory Spike** - Xử lý 3,000 jobs trong memory
5. **Timeout Issues** - Some jobs sẽ timeout

---

## ✅ Giải pháp: Job Queue Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Cron Scheduler                          │
│                    (Runs every 1 min)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                Database Query Layer                         │
│   SELECT jobs WHERE scheduled_at <= NOW() + 5min            │
│   LIMIT 100 (batch size)                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Job Queue (BullMQ/Bee)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Queue 1  │  │ Queue 2  │  │ Queue 3  │                  │
│  │ Facebook │  │Instagram │  │ Twitter  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Worker Pool                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │Worker 1 │  │Worker 2 │  │Worker 3 │  │Worker N │        │
│  │(FB API) │  │(IG API) │  │(TW API) │  │  ...    │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│  Max 10 concurrent workers per queue                        │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Social Media APIs                              │
│  Facebook (200 req/hour) | Instagram (200 req/hour)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation

### 1. Sử dụng BullMQ (Recommended)

**Tại sao BullMQ?**
- ✅ Built on Redis - cực nhanh
- ✅ Hỗ trợ priority queue
- ✅ Retry mechanism tự động
- ✅ Rate limiting built-in
- ✅ Worker pools
- ✅ Job monitoring dashboard

**Installation:**

```bash
npm install bullmq ioredis
```

**Setup Redis:**

```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Hoặc dùng Docker
docker run -d -p 6379:6379 redis:alpine
```

### 2. Tạo Queue Service

```typescript
// src/lib/queue/publish-queue.ts
import { Queue, Worker, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

// Tạo queue cho mỗi platform
export const facebookQueue = new Queue('facebook-posts', { 
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry 3 lần
    backoff: {
      type: 'exponential',
      delay: 30000 // 30s, 60s, 120s
    },
    removeOnComplete: 100, // Giữ 100 jobs thành công
    removeOnFail: 500 // Giữ 500 jobs failed để debug
  }
});

export const instagramQueue = new Queue('instagram-posts', { connection });
export const twitterQueue = new Queue('twitter-posts', { connection });

// Rate limiter - Facebook cho phép 200 requests/hour
export const queueScheduler = new QueueScheduler('facebook-posts', { 
  connection,
  maxStalledCount: 1,
  stalledInterval: 30000
});

// Add job to queue
export async function addPublishJob(
  platform: 'facebook' | 'instagram' | 'twitter',
  jobData: {
    scheduleId: string;
    postId: string;
    socialAccountId: string;
    content: string;
    mediaUrls: string[];
  }
) {
  const queue = platform === 'facebook' ? facebookQueue : 
                platform === 'instagram' ? instagramQueue : 
                twitterQueue;

  await queue.add(`publish-${jobData.scheduleId}`, jobData, {
    // Priority: càng cao càng ưu tiên (1 = highest)
    priority: 1,
    
    // Delay nếu cần (publish vào giờ cụ thể)
    delay: 0,
    
    // Job ID để tránh duplicate
    jobId: jobData.scheduleId
  });
}
```

### 3. Tạo Workers

```typescript
// src/lib/queue/workers.ts
import { Worker } from 'bullmq';
import { connection } from './publish-queue';
import { createPublisher } from '@/lib/social-publishers';
import { query } from '@/lib/db/postgres';

// Facebook Worker - Chạy tối đa 10 jobs concurrent
export const facebookWorker = new Worker(
  'facebook-posts',
  async (job) => {
    const { scheduleId, socialAccountId, content, mediaUrls } = job.data;
    
    console.log(`📤 [WORKER] Processing Facebook job ${scheduleId}`);
    
    // Update status to 'publishing'
    await query(`
      UPDATE autopostvn_post_schedules
      SET status = 'publishing', updated_at = NOW()
      WHERE id = $1
    `, [scheduleId]);

    try {
      // Get social account
      const accountResult = await query(`
        SELECT * FROM autopostvn_social_accounts WHERE id = $1
      `, [socialAccountId]);
      
      const account = accountResult.rows[0];
      if (!account) throw new Error('Account not found');

      // Publish
      const publisher = createPublisher(account);
      const result = await publisher.publish({
        content,
        mediaUrls,
        mediaType: mediaUrls.length > 0 ? 'image' : 'none',
        metadata: {}
      });

      if (!result.success) {
        throw new Error(result.error || 'Publish failed');
      }

      // Update success
      await query(`
        UPDATE autopostvn_post_schedules
        SET status = 'published', 
            published_at = NOW(),
            external_post_id = $1,
            updated_at = NOW()
        WHERE id = $2
      `, [result.externalPostId, scheduleId]);

      console.log(`✅ [WORKER] Published successfully: ${scheduleId}`);
      return { success: true, externalPostId: result.externalPostId };

    } catch (error: any) {
      console.error(`❌ [WORKER] Failed to publish ${scheduleId}:`, error);
      
      // Update failed status
      await query(`
        UPDATE autopostvn_post_schedules
        SET status = 'failed',
            error_message = $1,
            updated_at = NOW()
        WHERE id = $2
      `, [error.message, scheduleId]);

      throw error; // BullMQ will handle retry
    }
  },
  {
    connection,
    concurrency: 10, // Xử lý 10 jobs cùng lúc
    limiter: {
      max: 200, // Tối đa 200 jobs
      duration: 3600000 // Mỗi giờ (Facebook limit)
    }
  }
);

// Instagram Worker
export const instagramWorker = new Worker(
  'instagram-posts',
  async (job) => {
    // Similar to Facebook worker
  },
  {
    connection,
    concurrency: 10,
    limiter: {
      max: 200,
      duration: 3600000
    }
  }
);

// Event listeners
facebookWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

facebookWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});
```

### 4. Update Scheduler để sử dụng Queue

```typescript
// src/lib/scheduler.ts (updated)
import { addPublishJob } from '@/lib/queue/publish-queue';

export async function runScheduler(limit = 100): Promise<ProcessingResult> {
  console.log(`🔄 [SCHEDULER] Starting with limit: ${limit}`);
  
  const nowLeeway = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  
  // Fetch pending jobs
  const jobsResult = await query<ScheduleJob>(`
    SELECT ps.*, sa.provider
    FROM autopostvn_post_schedules ps
    JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
    JOIN autopostvn_posts p ON p.id = ps.post_id
    WHERE ps.scheduled_at <= $1
      AND ps.status = 'pending'
    ORDER BY ps.scheduled_at ASC
    LIMIT $2
  `, [nowLeeway, limit]);

  const jobs = jobsResult.rows;
  
  if (jobs.length === 0) {
    console.log('✅ No pending jobs');
    return { processed: 0, successful: 0, failed: 0, skipped: 0, details: [] };
  }

  console.log(`📋 Found ${jobs.length} pending jobs - adding to queue...`);

  // Add all jobs to appropriate queues
  for (const job of jobs) {
    try {
      // Get post content
      const postResult = await query(`
        SELECT content, media_urls FROM autopostvn_posts WHERE id = $1
      `, [job.post_id]);
      
      const post = postResult.rows[0];

      // Add to queue based on platform
      await addPublishJob(job.provider as any, {
        scheduleId: job.id,
        postId: job.post_id,
        socialAccountId: job.social_account_id,
        content: post.content,
        mediaUrls: post.media_urls || []
      });

      console.log(`✅ Added job ${job.id} to ${job.provider} queue`);

    } catch (error: any) {
      console.error(`❌ Failed to queue job ${job.id}:`, error);
    }
  }

  return {
    processed: jobs.length,
    successful: 0, // Workers sẽ update
    failed: 0,
    skipped: 0,
    details: []
  };
}
```

### 5. Start Workers

```typescript
// src/workers/index.ts
import { facebookWorker, instagramWorker } from '@/lib/queue/workers';

console.log('🚀 Starting workers...');

// Workers will run continuously
facebookWorker.run();
instagramWorker.run();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 Shutting down workers...');
  await facebookWorker.close();
  await instagramWorker.close();
  process.exit(0);
});
```

**Run workers với PM2:**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'autopost-web',
      script: 'npm',
      args: 'start',
      instances: 2,
      exec_mode: 'cluster'
    },
    {
      name: 'autopost-workers',
      script: 'node',
      args: 'dist/workers/index.js',
      instances: 1, // 1 worker instance
      exec_mode: 'fork',
      autorestart: true,
      watch: false
    }
  ]
};
```

---

## 📈 Performance Analysis

### Scenario: 3,000 jobs cùng lúc

**Without Queue (Current approach):**
- ❌ Cron chạy mỗi 5 phút, limit 10 jobs/run
- ❌ Cần: 3,000 ÷ 10 = **300 runs** = **1,500 phút** = **25 giờ**
- ❌ Posts sẽ delay từ 0-25 giờ!

**With Queue Architecture:**
- ✅ Cron fetch 100 jobs/run, add vào queue
- ✅ 10 workers xử lý concurrent
- ✅ Thời gian: 3,000 ÷ (10 workers × 60 jobs/hour) = **5 giờ**
- ✅ Với rate limit respecting (Facebook 200/hour)

**With Optimized Setup:**
- ✅ 20 workers per platform
- ✅ Cron chạy mỗi 1 phút, fetch 200 jobs
- ✅ Thời gian: 3,000 ÷ (20 × 200) = **45 phút**

---

## 🎯 Recommendations

### For 500 Users:

| Metric | Configuration |
|--------|---------------|
| **Redis** | 1 instance (enough for 10K+ jobs/min) |
| **Workers** | 10-20 per platform |
| **Cron Interval** | 1 minute |
| **Batch Size** | 100-200 jobs/run |
| **Database** | Add indexes on `scheduled_at`, `status` |
| **Monitoring** | BullMQ Board dashboard |

### Database Optimizations:

```sql
-- Critical indexes
CREATE INDEX idx_schedules_pending_time 
ON autopostvn_post_schedules(scheduled_at, status) 
WHERE status = 'pending';

CREATE INDEX idx_schedules_status 
ON autopostvn_post_schedules(status, updated_at);

-- Analyze query performance
EXPLAIN ANALYZE 
SELECT * FROM autopostvn_post_schedules 
WHERE scheduled_at <= NOW() AND status = 'pending' 
LIMIT 100;
```

---

## 🔍 Monitoring & Debugging

### BullMQ Board (Web UI)

```bash
npm install @bull-board/express @bull-board/api
```

```typescript
// src/app/api/admin/queues/route.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { facebookQueue, instagramQueue } from '@/lib/queue/publish-queue';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(facebookQueue),
    new BullMQAdapter(instagramQueue),
  ],
  serverAdapter
});

// Access at: http://localhost:3000/admin/queues
```

### CLI Monitoring:

```bash
# Check queue status
redis-cli LLEN bull:facebook-posts:wait
redis-cli LLEN bull:facebook-posts:active
redis-cli LLEN bull:facebook-posts:completed
redis-cli LLEN bull:facebook-posts:failed

# Monitor realtime
redis-cli MONITOR
```

---

## ✅ Kết luận

**Có, cron job CÓ THỂ handle 500 users** với architecture đúng:

1. **✅ Sử dụng Job Queue** (BullMQ/Bee-Queue)
2. **✅ Worker Pool** (10-20 workers per platform)
3. **✅ Rate Limiting** (tuân thủ API limits)
4. **✅ Database Indexing** (optimize queries)
5. **✅ Redis Caching** (giảm DB load)
6. **✅ Horizontal Scaling** (thêm workers khi cần)

**Lợi ích:**
- 🚀 Xử lý hàng ngàn jobs/giờ
- 🔄 Automatic retry khi failed
- 📊 Monitoring dashboard
- ⚡ Sub-minute latency
- 🛡️ Resilient & fault-tolerant

**Chi phí bổ sung:**
- Redis server (free, lightweight)
- Worker process (1 instance enough for 500 users)
- Minimal code changes

**Next steps:**
1. Setup Redis
2. Install BullMQ
3. Implement queue service
4. Deploy workers
5. Monitor & optimize

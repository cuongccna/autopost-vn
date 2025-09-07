# Render Cron Jobs Setup Guide for AutoPost VN

## 🎯 Mục tiêu
Thiết lập Render Cron Jobs để tự động post bài lên Facebook trong môi trường production, và cấu hình local tương tự.

## 📋 Render Cron Jobs - Cách hoạt động

### Render Cron Job Features:
- **Schedule**: Sử dụng cron expressions (UTC timezone)
- **Command**: Chạy lệnh Linux/bash command
- **Single-run guarantee**: Chỉ 1 instance chạy tại 1 thời điểm
- **Auto-stop**: Tự động dừng sau 12 giờ
- **Environment variables**: Chia sẻ với web service
- **Manual trigger**: Có thể trigger thủ công

## 🛠️ Cấu hình cho Render

### 1. Tạo Cron Job Script cho Render
Tạo file `scripts/render-cron.js`:

```javascript
#!/usr/bin/env node
/**
 * Render Cron Job Script
 * Equivalent to Render's cron job command
 */

const https = require('https');
const http = require('http');

const RENDER_INTERNAL_URL = process.env.RENDER_INTERNAL_URL || process.env.RENDER_URL || 'http://localhost:3000';

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function runScheduler() {
  try {
    log('🚀 Starting Render Cron Job - AutoPost VN Scheduler');
    
    // Health check first
    log('🏥 Checking application health...');
    const healthUrl = `${RENDER_INTERNAL_URL}/api/health`;
    const healthResult = await makeRequest(healthUrl);
    
    if (healthResult.status !== 200) {
      throw new Error(`Health check failed: ${healthResult.status}`);
    }
    
    log(`✅ Application healthy: ${healthResult.data.status}`);
    
    // Call scheduler
    log('📡 Calling scheduler API...');
    const schedulerUrl = `${RENDER_INTERNAL_URL}/api/cron/scheduler?limit=50`;
    const schedulerResult = await makeRequest(schedulerUrl);
    
    if (schedulerResult.status !== 200) {
      throw new Error(`Scheduler API failed: ${schedulerResult.status}`);
    }
    
    const result = schedulerResult.data;
    
    if (result.success) {
      const stats = `Processed=${result.processed}, Success=${result.successful}, Failed=${result.failed}`;
      log(`✅ Scheduler completed successfully: ${stats}`);
      
      // Log details if available
      if (result.details && result.details.length > 0) {
        log('📋 Post processing details:');
        result.details.forEach(detail => {
          const icon = detail.status === 'success' ? '✅' : 
                      detail.status === 'failed' ? '❌' : '⏭️';
          log(`  ${icon} Post ${detail.postId}: ${detail.message}`);
        });
      }
      
      // Exit successfully
      process.exit(0);
    } else {
      throw new Error(`Scheduler failed: ${result.error}`);
    }
    
  } catch (error) {
    log(`❌ Cron job failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the scheduler
runScheduler();
```

### 2. Tạo Build Script cho Render
Cập nhật `package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "cron:render": "node scripts/render-cron.js",
    "cron:local": "tsx scripts/cron-local.ts"
  }
}
```

### 3. Tạo render.yaml (Infrastructure as Code)
Tạo file `render.yaml`:

```yaml
services:
  # Web Service
  - type: web
    name: autopost-vn-web
    env: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: autopost-vn-db
          property: connectionString
      - key: NEXTAUTH_URL
        value: https://autopost-vn-web.onrender.com
      - key: NEXTAUTH_SECRET
        generateValue: true
      - key: FACEBOOK_CLIENT_ID
        sync: false  # Set manually in dashboard
      - key: FACEBOOK_CLIENT_SECRET
        sync: false  # Set manually in dashboard

  # Database
  - type: pgsql
    name: autopost-vn-db
    plan: starter
    databaseName: autopost_vn
    user: autopost_user

  # Cron Job for Auto Posting
  - type: cron
    name: autopost-vn-scheduler
    env: node
    schedule: "*/5 * * * *"  # Every 5 minutes
    buildCommand: npm ci
    startCommand: npm run cron:render
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: autopost-vn-db
          property: connectionString
      - key: RENDER_URL
        fromService:
          type: web
          name: autopost-vn-web
          property: host
      - key: FACEBOOK_CLIENT_ID
        sync: false
      - key: FACEBOOK_CLIENT_SECRET
        sync: false
```

## 🌍 Environment Variables cho Render

### Required Environment Variables:
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# NextAuth
NEXTAUTH_URL=https://your-app.onrender.com
NEXTAUTH_SECRET=your-secret-key

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Render Internal (Auto-set)
RENDER_URL=https://your-app.onrender.com
RENDER_INTERNAL_URL=http://your-app:10000  # Internal network
```

## 📅 Cron Schedules cho Render

### Common Cron Expressions (UTC):
```bash
# Every 5 minutes
*/5 * * * *

# Every hour at minute 0
0 * * * *

# Every day at 8 AM UTC (3 PM Vietnam)
0 8 * * *

# Every day at 12 PM UTC (7 PM Vietnam) 
0 12 * * *

# Business hours only (Monday-Friday, 9 AM - 5 PM UTC)
0 9-17 * * MON-FRI

# Golden hours (8 AM, 12 PM, 6 PM, 9 PM UTC)
0 8,12,18,21 * * *
```

## 🚀 Deployment Steps

### 1. Prepare Repository
```bash
# Add render.yaml to repository
git add render.yaml scripts/render-cron.js
git commit -m "Add Render deployment config"
git push origin main
```

### 2. Create Services in Render Dashboard

#### Option A: Using render.yaml (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. **New** → **Blueprint**
3. Connect your GitHub repository
4. Select `render.yaml`
5. Review and deploy

#### Option B: Manual Setup
1. **Create Web Service**:
   - Repository: `autopost-vn`
   - Branch: `main`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`

2. **Create Database**:
   - PostgreSQL
   - Plan: Starter ($7/month)

3. **Create Cron Job**:
   - Repository: `autopost-vn`
   - Branch: `main`
   - Schedule: `*/5 * * * *`
   - Command: `npm run cron:render`

### 3. Configure Environment Variables
Set in Render Dashboard for both Web Service and Cron Job:
- `DATABASE_URL` (from database)
- `NEXTAUTH_SECRET` (generate new)
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`

## 🧪 Local Testing (Simulate Render Environment)

### 1. Test Render Cron Script Locally
```bash
# Set environment variables
export RENDER_URL=http://localhost:3000
export NODE_ENV=production

# Run cron script
npm run cron:render
```

### 2. Test with Docker (Similar to Render)
Tạo `Dockerfile.cron`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Run cron job
CMD ["npm", "run", "cron:render"]
```

Test với Docker:
```bash
# Build image
docker build -f Dockerfile.cron -t autopost-cron .

# Run cron job
docker run --env-file .env autopost-cron
```

## 📊 Monitoring on Render

### 1. View Cron Job Logs
- Go to Render Dashboard
- Select your cron job service
- View **Logs** tab for execution history

### 2. Manual Trigger
- In cron job service page
- Click **Trigger Run** for manual execution

### 3. Expected Log Output
```
[2025-09-06T15:30:00.000Z] 🚀 Starting Render Cron Job - AutoPost VN Scheduler
[2025-09-06T15:30:01.000Z] 🏥 Checking application health...
[2025-09-06T15:30:01.500Z] ✅ Application healthy: healthy
[2025-09-06T15:30:02.000Z] 📡 Calling scheduler API...
[2025-09-06T15:30:05.000Z] ✅ Scheduler completed successfully: Processed=3, Success=2, Failed=1
[2025-09-06T15:30:05.100Z] 📋 Post processing details:
[2025-09-06T15:30:05.200Z]   ✅ Post 123: Published to Facebook successfully
[2025-09-06T15:30:05.300Z]   ✅ Post 124: Published to Facebook successfully  
[2025-09-06T15:30:05.400Z]   ❌ Post 125: Facebook API rate limit exceeded
```

## 💰 Render Pricing

### Cron Job Costs:
- **Minimum**: $1/month per cron job
- **Usage**: Prorated by second of execution time
- **Instance types**: Starter, Standard, Pro, Pro Plus

### Estimated Costs:
- **Every 5 minutes**: ~8,640 runs/month
- **Average 5 seconds/run**: ~12 hours/month
- **Cost**: ~$1-5/month depending on instance type

## ✅ Benefits of Render Cron vs Local Cron

| Feature | Local Windows Task | Render Cron Job |
|---------|-------------------|-----------------|
| **Reliability** | Depends on PC uptime | 99.9% uptime guaranteed |
| **Scaling** | Single machine | Auto-scaling available |
| **Monitoring** | Manual log checking | Built-in dashboard |
| **Environment** | Development setup | Production environment |
| **Maintenance** | Manual updates | Auto-deploy on git push |
| **Cost** | Free (electricity) | $1-5/month |

## 🎯 Next Steps

1. **Test locally**: `npm run cron:render`
2. **Deploy to Render**: Push `render.yaml` to repository
3. **Configure env vars**: Set Facebook OAuth credentials
4. **Monitor logs**: Check execution in Render dashboard
5. **Adjust schedule**: Optimize timing based on analytics

**🎉 Your AutoPost VN will now run reliably in production on Render!**

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

async function makeRequest(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const request = protocol.get(url, (res) => {
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
    
    // Set timeout
    request.setTimeout(timeout, () => {
      request.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });
  });
}

async function runScheduler() {
  try {
    log('🚀 Starting Render Cron Job - AutoPost VN Scheduler');
    log(`🌐 Target URL: ${RENDER_INTERNAL_URL}`);
    log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Health check first
    log('🏥 Checking application health...');
    const healthUrl = `${RENDER_INTERNAL_URL}/api/health`;
    const healthResult = await makeRequest(healthUrl, 10000);
    
    if (healthResult.status !== 200) {
      throw new Error(`Health check failed: ${healthResult.status} - ${healthResult.data}`);
    }
    
    log(`✅ Application healthy: ${healthResult.data.status || 'OK'}`);
    
    // Call scheduler with higher limit for production
    const limit = process.env.NODE_ENV === 'production' ? 50 : 10;
    log(`📡 Calling scheduler API with limit: ${limit}...`);
    
    const schedulerUrl = `${RENDER_INTERNAL_URL}/api/cron/scheduler?limit=${limit}`;
    const schedulerResult = await makeRequest(schedulerUrl, 60000);
    
    if (schedulerResult.status !== 200) {
      throw new Error(`Scheduler API failed: ${schedulerResult.status} - ${JSON.stringify(schedulerResult.data)}`);
    }
    
    const result = schedulerResult.data;
    
    if (result.success) {
      const stats = `Processed=${result.processed}, Success=${result.successful}, Failed=${result.failed}`;
      log(`✅ Scheduler completed successfully: ${stats}`);
      
      // Log summary stats
      if (result.processed > 0) {
        log(`📊 Execution summary: ${result.processed} posts processed in total`);
      } else {
        log(`💤 No posts to process at this time`);
      }
      
      // Log details if available
      if (result.details && result.details.length > 0) {
        log('📋 Post processing details:');
        result.details.forEach(detail => {
          const icon = detail.status === 'success' ? '✅' : 
                      detail.status === 'failed' ? '❌' : '⏭️';
          log(`  ${icon} Post ${detail.postId}: ${detail.message}`);
        });
      }
      
      // Success exit
      log('🎉 Cron job completed successfully');
      process.exit(0);
      
    } else {
      throw new Error(`Scheduler failed: ${result.error}`);
    }
    
  } catch (error) {
    log(`❌ Cron job failed: ${error.message}`);
    
    // Log additional debugging info
    if (error.code) {
      log(`🔍 Error code: ${error.code}`);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error details:', error);
    }
    
    // Failure exit
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`💥 Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run the scheduler
log('🏃 Starting cron job execution...');
runScheduler();

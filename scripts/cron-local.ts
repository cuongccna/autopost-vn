import 'dotenv/config';
import { runScheduler } from '../src/lib/scheduler';

async function main() {
  try {
    console.log('🚀 Starting local TypeScript scheduler...');
    const result = await runScheduler(10);
    console.log('✅ Scheduler completed:', result);
    
    // Log chi tiết
    if (result.processed > 0) {
      console.log(`📊 Stats: Processed=${result.processed}, Success=${result.successful}, Failed=${result.failed}`);
      
      if (result.details && result.details.length > 0) {
        console.log('📋 Details:');
        result.details.forEach(detail => {
          const status = detail.status === 'success' ? '✅' : detail.status === 'failed' ? '❌' : '⏭️';
          console.log(`  ${status} Post ${detail.postId}: ${detail.message}`);
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Scheduler error:', error);
    process.exit(1);
  }
}

main();
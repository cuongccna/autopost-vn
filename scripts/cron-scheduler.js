import 'dotenv/config';
import { runScheduler } from '../src/lib/scheduler.js';

async function main() {
  try {
    console.log('🚀 Starting local scheduler...');
    const result = await runScheduler(10);
    console.log('✅ Scheduler completed:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ Scheduler error:', error);
    process.exit(1);
  }
}

main();

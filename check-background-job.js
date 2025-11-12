const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'autopost_vn',
  user: 'autopost_admin',
  password: 'autopost_vn_secure_2025',
});

async function checkBackgroundJob() {
  const client = await pool.connect();
  try {
    console.log('🔍 Kiểm tra Background Job tự động post...\n');
    
    // 1. Kiểm tra có bài scheduled chưa
    console.log('📅 1. Checking scheduled posts...');
    const scheduledPosts = await client.query(`
      SELECT 
        ps.id,
        ps.post_id,
        ps.scheduled_at,
        ps.status,
        ps.social_account_id,
        p.title,
        p.content
      FROM autopostvn_post_schedules ps
      JOIN autopostvn_posts p ON p.id = ps.post_id
      WHERE ps.status IN ('pending', 'publishing')
      ORDER BY ps.scheduled_at ASC
      LIMIT 10
    `);
    
    console.log(`   Found ${scheduledPosts.rows.length} scheduled posts`);
    if (scheduledPosts.rows.length > 0) {
      console.table(scheduledPosts.rows.map(r => ({
        id: r.id.substring(0, 8),
        title: r.title?.substring(0, 30) || 'N/A',
        scheduled_at: r.scheduled_at,
        status: r.status
      })));
    }
    
    // 2. Kiểm tra scheduled posts đã đến giờ (ready to publish)
    console.log('\n⏰ 2. Posts ready to publish (scheduled_at <= now):');
    const readyPosts = await client.query(`
      SELECT 
        ps.id,
        ps.post_id,
        ps.scheduled_at,
        ps.status,
        p.title,
        NOW() - ps.scheduled_at as overdue
      FROM autopostvn_post_schedules ps
      JOIN autopostvn_posts p ON p.id = ps.post_id
      WHERE ps.status = 'pending'
        AND ps.scheduled_at <= NOW()
      ORDER BY ps.scheduled_at ASC
    `);
    
    console.log(`   ${readyPosts.rows.length} posts are ready to be published NOW`);
    if (readyPosts.rows.length > 0) {
      console.table(readyPosts.rows.map(r => ({
        id: r.id.substring(0, 8),
        title: r.title?.substring(0, 30) || 'N/A',
        scheduled_at: r.scheduled_at,
        status: r.status,
        overdue: r.overdue
      })));
    }
    
    // 3. Kiểm tra API endpoint scheduler
    console.log('\n🔌 3. Checking scheduler API endpoints...');
    console.log('   Available endpoints:');
    console.log('   - GET  /api/cron/scheduler');
    console.log('   - POST /api/cron/scheduler');
    console.log('   - GET  /api/cron/scheduler-optimized');
    
    // 4. Kiểm tra có cron job running không
    console.log('\n⚙️  4. Checking background job setup...');
    const fs = require('fs');
    const path = require('path');
    
    const cronScripts = [
      'scripts/cron-scheduler.js',
      'scripts/cron-interval.js',
      'scripts/cron-local.ts'
    ];
    
    console.log('   Cron scripts found:');
    cronScripts.forEach(script => {
      const scriptPath = path.join(process.cwd(), script);
      if (fs.existsSync(scriptPath)) {
        console.log(`   ✅ ${script}`);
      } else {
        console.log(`   ❌ ${script} (not found)`);
      }
    });
    
    // 5. Kiểm tra activity logs gần đây
    console.log('\n📊 5. Recent scheduler activities:');
    const activities = await client.query(`
      SELECT 
        activity_type,
        created_at,
        metadata
      FROM autopostvn_activity_logs
      WHERE activity_type IN ('post_published', 'post_failed', 'post_validated')
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    if (activities.rows.length > 0) {
      console.log(`   Found ${activities.rows.length} recent activities`);
      console.table(activities.rows);
    } else {
      console.log('   ⚠️  No recent scheduler activities found');
    }
    
    // 6. Summary & Recommendations
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY & RECOMMENDATIONS:');
    console.log('='.repeat(60));
    
    if (readyPosts.rows.length > 0) {
      console.log(`✅ You have ${readyPosts.rows.length} posts ready to publish`);
      console.log('\n🚀 To publish them now, run one of these:');
      console.log('   1. Manual trigger: curl http://localhost:3000/api/cron/scheduler');
      console.log('   2. Run script: node scripts/cron-scheduler.js');
      console.log('   3. Use SchedulerMonitor component in the app');
    } else {
      console.log('ℹ️  No posts ready to publish at this moment');
    }
    
    if (scheduledPosts.rows.length === 0) {
      console.log('\n⚠️  WARNING: No scheduled posts found!');
      console.log('   Create some posts with future scheduled_at to test auto-posting');
    }
    
    console.log('\n📝 To setup automatic background job:');
    console.log('   Windows: Use Task Scheduler (see CRON_SETUP_GUIDE.md)');
    console.log('   Linux: Setup cron job (see CRON_SETUP_GUIDE.md)');
    console.log('   Vercel: Use Vercel Cron (see CRON_SETUP_GUIDE.md)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkBackgroundJob();

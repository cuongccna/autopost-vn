const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'autopost_vn',
  user: 'autopost_admin',
  password: 'autopost_vn_secure_2025',
});

async function createTestScheduledPost() {
  const client = await pool.connect();
  try {
    const userId = '6b02ec4d-e0de-4834-a48f-84999e696891';
    const workspaceId = '486fdee4-7b40-453d-bb69-681b9f3f58f8';
    
    // Get social accounts
    const accountsResult = await client.query(`
      SELECT id, provider, name FROM autopostvn_social_accounts
      WHERE workspace_id = $1 AND provider IN ('facebook_page', 'facebook')
      LIMIT 2
    `, [workspaceId]);
    
    if (accountsResult.rows.length === 0) {
      console.log('❌ No social accounts found. Please connect Facebook first!');
      return;
    }
    
    console.log(`✅ Found ${accountsResult.rows.length} social accounts`);
    
    // Create a test post scheduled for 2 minutes from now
    const scheduledAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
    
    const postResult = await client.query(`
      INSERT INTO autopostvn_posts (
        workspace_id, user_id, title, content, media_urls, providers, 
        status, scheduled_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, title, scheduled_at
    `, [
      workspaceId,
      userId,
      'Test Auto Post 🚀',
      'Đây là bài test tự động post từ scheduler. Bài này được lên lịch tự động! #autopost #test',
      [],
      accountsResult.rows.map(a => a.provider),
      'scheduled',
      scheduledAt.toISOString()
    ]);
    
    const post = postResult.rows[0];
    console.log(`\n📝 Created post: ${post.title}`);
    console.log(`   ID: ${post.id}`);
    console.log(`   Scheduled at: ${post.scheduled_at}`);
    
    // Create schedules for each social account
    for (const account of accountsResult.rows) {
      const scheduleResult = await client.query(`
        INSERT INTO autopostvn_post_schedules (
          post_id, social_account_id, scheduled_at, status, 
          retry_count, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id
      `, [
        post.id,
        account.id,
        scheduledAt.toISOString(),
        'pending',
        0
      ]);
      
      console.log(`   ✅ Schedule created for ${account.provider}: ${account.name} (${scheduleResult.rows[0].id})`);
    }
    
    console.log(`\n⏰ Post will be auto-published in 2 minutes at: ${scheduledAt.toLocaleString()}`);
    console.log(`\n🧪 To test now, run:`);
    console.log(`   curl http://localhost:3000/api/test/scheduler`);
    console.log(`   or click "Test Now" in SchedulerMonitor component`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestScheduledPost();

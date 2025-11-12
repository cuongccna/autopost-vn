/**
 * Create test social accounts for a workspace
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE || 'autopost_vn',
  user: process.env.POSTGRES_USER || 'autopost_admin',
  password: process.env.POSTGRES_PASSWORD || 'autopost_vn_secure_2025',
});

async function createTestAccounts() {
  const client = await pool.connect();
  
  try {
    const WORKSPACE_ID = '486fdee4-7b40-453d-bb69-681b9f3f58f8';
    const USER_ID = '6b02ec4d-e0de-4834-a48f-84999e696891';

    console.log('\n🔗 Creating Test Social Accounts\n');
    console.log('═'.repeat(80));

    // Create Facebook account
    console.log('\n1️⃣  Creating Facebook account...');
    const fbAccount = await client.query(`
      INSERT INTO autopostvn_social_accounts 
        (workspace_id, provider, provider_id, name, platform_name, username, token_encrypted, status, metadata, created_at, updated_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, provider, platform_name
    `, [
      WORKSPACE_ID,
      'facebook_page',
      'test-fb-page-123',
      'Test Facebook Page',
      'Test FB Page',
      '@testfbpage',
      'encrypted_token_fake_123',
      'connected',
      JSON.stringify({ test: true, note: 'Test account for development' })
    ]);

    console.log(`   ✅ Created: ${fbAccount.rows[0].platform_name} (${fbAccount.rows[0].id})`);

    // Create Instagram account
    console.log('\n2️⃣  Creating Instagram account...');
    const igAccount = await client.query(`
      INSERT INTO autopostvn_social_accounts 
        (workspace_id, provider, provider_id, name, platform_name, username, token_encrypted, status, metadata, created_at, updated_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, provider, platform_name
    `, [
      WORKSPACE_ID,
      'instagram',
      'test-ig-123',
      'Test Instagram',
      'Test IG',
      '@testig',
      'encrypted_token_fake_456',
      'connected',
      JSON.stringify({ test: true, note: 'Test account for development' })
    ]);

    console.log(`   ✅ Created: ${igAccount.rows[0].platform_name} (${igAccount.rows[0].id})`);

    // Update posts to link with these accounts
    console.log('\n3️⃣  Updating posts with schedules...');
    
    const posts = await client.query(`
      SELECT id, title FROM autopostvn_posts 
      WHERE workspace_id = $1 AND user_id = $2
    `, [WORKSPACE_ID, USER_ID]);

    for (const post of posts.rows) {
      // Create schedule for Facebook
      await client.query(`
        INSERT INTO autopostvn_post_schedules 
          (post_id, social_account_id, scheduled_at, status, created_at, updated_at)
        VALUES ($1, $2, NOW() + interval '1 hour', $3, NOW(), NOW())
      `, [post.id, fbAccount.rows[0].id, 'pending']);

      // Create schedule for Instagram
      await client.query(`
        INSERT INTO autopostvn_post_schedules 
          (post_id, social_account_id, scheduled_at, status, created_at, updated_at)
        VALUES ($1, $2, NOW() + interval '1 hour', $3, NOW(), NOW())
      `, [post.id, igAccount.rows[0].id, 'pending']);

      console.log(`   ✅ Created schedules for: ${post.title?.substring(0, 50)}`);
    }

    // Update post status to scheduled
    console.log('\n4️⃣  Updating post status to scheduled...');
    await client.query(`
      UPDATE autopostvn_posts
      SET status = 'scheduled', updated_at = NOW()
      WHERE workspace_id = $1 AND user_id = $2 AND status = 'draft'
    `, [WORKSPACE_ID, USER_ID]);

    console.log('   ✅ Posts status updated');

    // Verify
    console.log('\n5️⃣  Verification:');
    const verification = await client.query(`
      SELECT 
        p.id,
        p.title,
        p.status,
        COALESCE(json_agg(
          json_build_object(
            'account', sa.platform_name,
            'provider', sa.provider,
            'status', ps.status,
            'scheduled_at', ps.scheduled_at
          )
        ) FILTER (WHERE ps.id IS NOT NULL), '[]') as schedules
      FROM autopostvn_posts p
      LEFT JOIN autopostvn_post_schedules ps ON ps.post_id = p.id
      LEFT JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
      WHERE p.workspace_id = $1 AND p.user_id = $2
      GROUP BY p.id
    `, [WORKSPACE_ID, USER_ID]);

    for (const post of verification.rows) {
      console.log(`\n   📝 ${post.title?.substring(0, 50)}`);
      console.log(`      Status: ${post.status}`);
      console.log(`      Schedules: ${post.schedules.length}`);
      for (const schedule of post.schedules) {
        console.log(`        • ${schedule.account}: ${schedule.status} @ ${schedule.scheduled_at}`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Test accounts created successfully!');
    console.log('\n💡 Now refresh your app - posts should appear!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestAccounts().catch(console.error);

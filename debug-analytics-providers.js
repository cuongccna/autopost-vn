require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugProviders() {
  const client = await pool.connect();
  
  try {
    console.log('\n📊 Debug Analytics - Providers Data\n');
    console.log('='.repeat(60));

    // 1. Check all schedules by provider
    const schedulesByProvider = await client.query(`
      SELECT 
        sa.provider,
        ps.status,
        COUNT(*) as count
      FROM autopostvn_post_schedules ps
      JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
      GROUP BY sa.provider, ps.status
      ORDER BY sa.provider, ps.status
    `);

    console.log('\n1️⃣  Schedules by Provider & Status:');
    schedulesByProvider.rows.forEach(row => {
      console.log(`   ${row.provider}: ${row.status} = ${row.count}`);
    });

    // 2. Check unique providers in social_accounts
    const providers = await client.query(`
      SELECT DISTINCT provider FROM autopostvn_social_accounts ORDER BY provider
    `);

    console.log('\n2️⃣  Unique Providers in social_accounts:');
    providers.rows.forEach(row => {
      console.log(`   - ${row.provider}`);
    });

    // 3. Check Facebook posts specifically
    const fbPosts = await client.query(`
      SELECT 
        p.id,
        p.title,
        p.status as post_status,
        ps.status as schedule_status,
        sa.provider,
        sa.platform_name
      FROM autopostvn_posts p
      LEFT JOIN autopostvn_post_schedules ps ON ps.post_id = p.id
      LEFT JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
      WHERE sa.provider LIKE '%facebook%' OR sa.provider = 'facebook_page'
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    console.log('\n3️⃣  Facebook Posts (last 10):');
    if (fbPosts.rows.length === 0) {
      console.log('   ⚠️  No Facebook posts found!');
    } else {
      fbPosts.rows.forEach(row => {
        console.log(`   - "${row.title?.substring(0, 40)}..."`);
        console.log(`     Provider: ${row.provider}`);
        console.log(`     Schedule Status: ${row.schedule_status}`);
      });
    }

    // 4. Check all scheduled/pending posts
    const scheduledPosts = await client.query(`
      SELECT 
        p.id,
        p.title,
        p.status as post_status,
        ps.status as schedule_status,
        ps.scheduled_at,
        sa.provider,
        sa.platform_name
      FROM autopostvn_posts p
      JOIN autopostvn_post_schedules ps ON ps.post_id = p.id
      JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
      WHERE ps.status IN ('pending', 'scheduled')
      ORDER BY ps.scheduled_at ASC
      LIMIT 20
    `);

    console.log('\n4️⃣  All Scheduled/Pending Posts:');
    if (scheduledPosts.rows.length === 0) {
      console.log('   ⚠️  No scheduled/pending posts found!');
    } else {
      scheduledPosts.rows.forEach(row => {
        console.log(`   - "${row.title?.substring(0, 40)}..."`);
        console.log(`     Provider: ${row.provider}`);
        console.log(`     Schedule Status: ${row.schedule_status}`);
        console.log(`     Scheduled At: ${row.scheduled_at}`);
      });
    }

    // 5. Summary by provider for UI
    const summary = await client.query(`
      SELECT 
        CASE 
          WHEN sa.provider = 'facebook_page' THEN 'facebook'
          WHEN sa.provider = 'instagram_business' THEN 'instagram'
          ELSE sa.provider
        END as mapped_provider,
        COUNT(*) as total,
        COUNT(CASE WHEN ps.status = 'published' THEN 1 END) as published,
        COUNT(CASE WHEN ps.status IN ('pending', 'scheduled') THEN 1 END) as scheduled,
        COUNT(CASE WHEN ps.status = 'failed' THEN 1 END) as failed
      FROM autopostvn_post_schedules ps
      JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
      GROUP BY mapped_provider
      ORDER BY mapped_provider
    `);

    console.log('\n5️⃣  Summary for UI (Mapped Providers):');
    summary.rows.forEach(row => {
      console.log(`   ${row.mapped_provider}:`);
      console.log(`     Total: ${row.total}, Published: ${row.published}, Scheduled: ${row.scheduled}, Failed: ${row.failed}`);
    });

  } finally {
    client.release();
    await pool.end();
  }
}

debugProviders().catch(console.error);

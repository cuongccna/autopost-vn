const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'autopost_vn',
  user: 'autopost_admin',
  password: 'autopost_vn_secure_2025',
  ssl: false
});

async function checkInstagramPost() {
  try {
    console.log('🔍 Checking recent failed Instagram posts...\n');

    // Get the most recent failed Instagram post
    const result = await pool.query(`
      SELECT 
        s.id,
        s.content,
        s.media_urls,
        s.scheduled_at,
        s.status,
        s.error_message,
        sa.name as account_name,
        sa.provider_id as instagram_account_id
      FROM autopostvn_scheduled_posts s
      JOIN autopostvn_social_accounts sa ON s.social_account_id = sa.id
      WHERE sa.provider = 'instagram'
        AND s.status = 'failed'
      ORDER BY s.scheduled_at DESC
      LIMIT 5
    `);

    if (result.rows.length === 0) {
      console.log('❌ No failed Instagram posts found');
      return;
    }

    console.log(`Found ${result.rows.length} failed posts:\n`);

    for (const post of result.rows) {
      console.log('📋 Post Details:');
      console.log('  ID:', post.id);
      console.log('  Account:', post.account_name);
      console.log('  Instagram ID:', post.instagram_account_id);
      console.log('  Status:', post.status);
      console.log('  Content:', post.content?.substring(0, 100) + '...');
      console.log('  Media URLs:', post.media_urls);
      console.log('  Media URL Type:', typeof post.media_urls);
      console.log('  Is Array:', Array.isArray(post.media_urls));
      console.log('  Error:', post.error_message);
      console.log('  Scheduled:', post.scheduled_at);
      
      // Check if media_urls are valid
      if (post.media_urls && post.media_urls.length > 0) {
        console.log('\n  🔗 Checking media URLs:');
        post.media_urls.forEach((url, i) => {
          console.log(`    ${i + 1}. ${url}`);
          console.log(`       - Starts with http: ${url.startsWith('http')}`);
          console.log(`       - Length: ${url.length} chars`);
          console.log(`       - Contains localhost: ${url.includes('localhost')}`);
          console.log(`       - Contains 127.0.0.1: ${url.includes('127.0.0.1')}`);
        });
      } else {
        console.log('  ⚠️ No media URLs found!');
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkInstagramPost();

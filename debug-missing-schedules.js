require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    // Get scheduled posts without schedules
    const posts = await client.query(`
      SELECT p.id, p.title, p.status, p.scheduled_at, p.workspace_id, p.user_id 
      FROM autopostvn_posts p 
      LEFT JOIN autopostvn_post_schedules ps ON ps.post_id = p.id 
      WHERE p.status = 'scheduled' AND ps.id IS NULL
    `);
    
    console.log('Scheduled posts without schedule records:');
    posts.rows.forEach(p => {
      console.log('ID: ' + p.id);
      console.log('Title: ' + p.title?.substring(0, 50));
      console.log('scheduled_at: ' + p.scheduled_at);
      console.log('workspace_id: ' + p.workspace_id);
      console.log('---');
    });

    // Get all workspace IDs
    const workspaces = [...new Set(posts.rows.map(p => p.workspace_id))];
    
    for (const ws of workspaces) {
      const accounts = await client.query(`
        SELECT id, provider, platform_name 
        FROM autopostvn_social_accounts 
        WHERE workspace_id = $1 AND status = 'connected'
      `, [ws]);
      
      console.log('\nAvailable accounts for workspace ' + ws + ':');
      accounts.rows.forEach(a => console.log('  - ' + a.provider + ': ' + a.platform_name));
    }

  } finally {
    client.release();
    await pool.end();
  }
}
check();

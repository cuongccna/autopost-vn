const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'autopost_vn',
  user: 'autopost_admin',
  password: 'autopost_vn_secure_2025'
});

async function checkInstagramSupport() {
  try {
    console.log('🔍 Checking Instagram provider support...\n');
    
    // Check provider constraint on social_accounts
    const constraintResult = await pool.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'autopostvn_social_accounts'::regclass
      AND conname LIKE '%provider%'
    `);
    
    console.log('📋 Provider constraints on autopostvn_social_accounts:');
    constraintResult.rows.forEach(row => {
      console.log(`  ${row.constraint_name}:`);
      console.log(`    ${row.constraint_definition}\n`);
    });
    
    // Check if instagram provider exists in data
    const instagramAccounts = await pool.query(`
      SELECT id, name, provider, status
      FROM autopostvn_social_accounts
      WHERE provider = 'instagram'
      LIMIT 5
    `);
    
    console.log(`\n📊 Existing Instagram accounts: ${instagramAccounts.rows.length}`);
    if (instagramAccounts.rows.length > 0) {
      instagramAccounts.rows.forEach(acc => {
        console.log(`  - ${acc.name} (${acc.status})`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkInstagramSupport();

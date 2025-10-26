/**
 * Check database tables
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('🔍 Checking database tables...\n');

  const tables = [
    'autopostvn_posts',
    'autopostvn_scheduled_posts',
    'autopostvn_social_accounts',
    'autopostvn_post_schedules'
  ];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: EXISTS`);
    }
  }

  console.log('\n📊 Checking actual table structure...');
  
  // Query information schema
  const { data: tableInfo, error: schemaError } = await supabase
    .rpc('exec_sql', { 
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'autopostvn%'
        ORDER BY table_name
      `
    })
    .catch(() => {
      // RPC might not exist, try direct query
      return { data: null, error: null };
    });

  if (tableInfo) {
    console.log('\nTables in database:');
    tableInfo.forEach(t => console.log(`  - ${t.table_name}`));
  }
}

checkTables().catch(console.error);

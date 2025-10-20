const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking post_schedules schema...\n');
  
  const { data, error } = await supabase
    .from('autopostvn_post_schedules')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('📋 Columns:');
    console.log(Object.keys(data[0]).join(', '));
    console.log('\n📊 Sample data:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

checkSchema().catch(console.error);

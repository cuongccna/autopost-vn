/**
 * Get workspace ID for testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getWorkspaceId() {
  console.log('🔍 Getting workspace ID...\n');

  const { data, error } = await supabase
    .from('autopostvn_workspaces')
    .select('id, name')
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (data) {
    console.log('✅ Workspace found:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Name: ${data.name || 'Unnamed'}\n`);
    console.log('📋 Test Analytics API:');
    console.log(`   http://localhost:3000/api/analytics?workspace_id=${data.id}\n`);
    console.log('🔗 Copy this URL to test in browser! ✨');
  } else {
    console.log('⚠️  No workspace found');
  }
}

getWorkspaceId();

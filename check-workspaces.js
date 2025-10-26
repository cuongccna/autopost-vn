const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hvkeqykxtxivwzhipkob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a2VxeWt4dHhpdnd6aGlwa29iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODkwNTc3MSwiZXhwIjoyMDQ0NDgxNzcxfQ.gFWSSor81dQKxWRkrGNUGMZUF79G1cGUBQVl0SyBcWw';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function checkWorkspaces() {
  console.log('🔍 Checking workspaces...\n');
  
  const { data: workspaces, error } = await supabase
    .from('autopostvn_workspaces')
    .select('id, name, slug, settings');
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`Found ${workspaces.length} workspaces:\n`);
  workspaces.forEach(ws => {
    console.log(`ID: ${ws.id}`);
    console.log(`Name: ${ws.name}`);
    console.log(`Slug: ${ws.slug}`);
    console.log(`Settings: ${JSON.stringify(ws.settings, null, 2)}`);
    console.log('---\n');
  });
}

checkWorkspaces();

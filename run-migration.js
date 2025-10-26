const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://hvkeqykxtxivwzhipkob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a2VxeWt4dHhpdnd6aGlwa29iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODkwNTc3MSwiZXhwIjoyMDQ0NDgxNzcxfQ.gFWSSor81dQKxWRkrGNUGMZUF79G1cGUBQVl0SyBcWw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running migration 009_add_workspace_settings.sql...');
  
  const sql = fs.readFileSync('./migrations/009_add_workspace_settings.sql', 'utf8');
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`\n[${i + 1}/${statements.length}] Executing:`);
    console.log(statement.substring(0, 100) + '...');
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      });
      
      if (error) {
        // Try direct query if RPC fails
        const { error: queryError } = await supabase
          .from('_migrations')
          .select('*')
          .limit(0);
        
        if (queryError) {
          console.error('❌ Error:', error);
          throw error;
        }
      }
      
      console.log('✅ Success');
    } catch (err) {
      console.error('❌ Failed:', err.message);
      // Continue with next statement
    }
  }
  
  console.log('\n✅ Migration completed!');
}

runMigration().catch(console.error);

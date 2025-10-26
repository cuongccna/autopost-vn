const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hvkeqykxtxivwzhipkob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a2VxeWt4dHhpdnd6aGlwa29iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODkwNTc3MSwiZXhwIjoyMDQ0NDgxNzcxfQ.gFWSSor81dQKxWRkrGNUGMZUF79G1cGUBQVl0SyBcWw';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const DEFAULT_SETTINGS = {
  notifications: {
    onSuccess: true,
    onFailure: true,
    onTokenExpiry: true
  },
  scheduling: {
    timezone: 'Asia/Ho_Chi_Minh',
    goldenHours: ['09:00', '12:30', '20:00'],
    rateLimit: 10
  },
  advanced: {
    autoDeleteOldPosts: false,
    autoDeleteDays: 30,
    testMode: false
  }
};

async function updateWorkspaceSettings() {
  console.log('🚀 Updating workspace settings...\n');
  
  try {
    // Get all workspaces
    const { data: workspaces, error: fetchError } = await supabase
      .from('autopostvn_workspaces')
      .select('id, name, slug, settings');
    
    if (fetchError) {
      console.error('❌ Error fetching workspaces:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${workspaces.length} workspaces\n`);
    
    // Update each workspace
    for (const workspace of workspaces) {
      console.log(`Updating ${workspace.name} (${workspace.slug})...`);
      
      // Check if settings is empty or null
      const needsUpdate = !workspace.settings || 
                         Object.keys(workspace.settings).length === 0 ||
                         !workspace.settings.notifications ||
                         !workspace.settings.scheduling;
      
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('autopostvn_workspaces')
          .update({ 
            settings: DEFAULT_SETTINGS,
            updated_at: new Date().toISOString()
          })
          .eq('id', workspace.id);
        
        if (updateError) {
          console.error(`  ❌ Error:`, updateError.message);
        } else {
          console.log(`  ✅ Updated with default settings`);
        }
      } else {
        console.log(`  ℹ️  Already has settings`);
      }
    }
    
    console.log('\n✅ All workspaces updated!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateWorkspaceSettings();

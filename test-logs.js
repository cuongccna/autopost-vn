const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createTestLogs() {
  const logs = [
    {
      user_id: '019534da-5e93-7633-b0ec-a26b6d7c9a4f',
      workspace_id: 'e5e2b3f1-4e8a-4d3b-9c2f-1a8e7d6c5b4a',
      action_type: 'post_created',
      entity_type: 'post',
      entity_id: 'test-post-1',
      details: { title: 'Bài test 1', providers: ['facebook', 'instagram'] },
      ip_address: '127.0.0.1',
      user_agent: 'Test Browser'
    },
    {
      user_id: '019534da-5e93-7633-b0ec-a26b6d7c9a4f',
      workspace_id: 'e5e2b3f1-4e8a-4d3b-9c2f-1a8e7d6c5b4a',
      action_type: 'account_connected',
      entity_type: 'social_account',
      entity_id: 'fb-account-1',
      details: { provider: 'facebook', account_name: 'Test Facebook Page' },
      ip_address: '127.0.0.1',
      user_agent: 'Test Browser'
    },
    {
      user_id: '019534da-5e93-7633-b0ec-a26b6d7c9a4f',
      workspace_id: 'e5e2b3f1-4e8a-4d3b-9c2f-1a8e7d6c5b4a',
      action_type: 'post_published',
      entity_type: 'post',
      entity_id: 'test-post-2',
      details: { title: 'Bài đã đăng', provider: 'instagram' },
      ip_address: '127.0.0.1',
      user_agent: 'Test Browser'
    }
  ];

  for (const log of logs) {
    const { error } = await supabase
      .from('autopostvn_system_activity_logs')
      .insert(log);
    
    if (error) {
      console.error('Error inserting log:', error);
    } else {
      console.log('Inserted log:', log.action_type);
    }
  }
}

createTestLogs().then(() => {
  console.log('Done creating test logs');
  process.exit(0);
}).catch(console.error);

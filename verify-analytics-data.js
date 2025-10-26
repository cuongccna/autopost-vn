const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fmvxmvahknbzzjzhofql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdnhtdmFoa25ienpqemhvZnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxNzM4NSwiZXhwIjoyMDcxMTkzMzg1fQ.4QdCKgptvWzLEKgAxgLbvfORLLwzu8aXUzTYp1fw_oo'
);

async function verifyAnalyticsData() {
  console.log('\n✅ Kiểm tra dữ liệu cho Analytics Dashboard\n');

  const workspaceId = 'ed172ece-2dc6-4ee2-b1cf-0c1301681650';

  // 1. Check published posts
  const { data: schedules, error: schedError } = await supabase
    .from('autopostvn_post_schedules')
    .select(`
      id,
      post_id,
      external_post_id,
      published_at,
      social_account_id,
      status
    `)
    .eq('status', 'published')
    .not('external_post_id', 'is', null)
    .order('published_at', { ascending: false });

  if (schedError) {
    console.error('❌ Error:', schedError);
    return;
  }

  console.log(`📊 Tổng số bài đã đăng: ${schedules?.length || 0}`);

  if (schedules && schedules.length > 0) {
    console.log('\n📝 Chi tiết:');
    schedules.forEach((sched, index) => {
      console.log(`   ${index + 1}. Post ID: ${sched.post_id}`);
      console.log(`      Platform Post ID: ${sched.external_post_id}`);
      console.log(`      Published: ${new Date(sched.published_at).toLocaleString('vi-VN')}\n`);
    });

    // 2. Check social accounts
    const accountIds = [...new Set(schedules.map(s => s.social_account_id))];
    const { data: accounts } = await supabase
      .from('autopostvn_social_accounts')
      .select('id, name, provider, workspace_id')
      .in('id', accountIds);

    console.log(`\n📱 Tài khoản đã đăng:`);
    const workspaceAccounts = accounts?.filter(a => a.workspace_id === workspaceId) || [];
    workspaceAccounts.forEach((acc, index) => {
      const accountPosts = schedules.filter(s => s.social_account_id === acc.id);
      console.log(`   ${index + 1}. ${acc.name} (${acc.provider})`);
      console.log(`      ${accountPosts.length} bài đăng`);
    });

    // 3. Summary
    console.log('\n📈 Tóm tắt:');
    console.log(`   ✅ Có ${schedules.length} bài đã đăng thành công`);
    console.log(`   ✅ Trên ${workspaceAccounts.length} tài khoản`);
    console.log(`   ✅ Workspace: ${workspaceId}`);
    
    console.log('\n💡 Analytics Dashboard sẽ hiển thị:');
    console.log('   1. Tổng bài đăng');
    console.log('   2. Tỷ lệ thành công: 100%');
    console.log('   3. Tương tác TB (cần 15-30 phút để Facebook tạo insights)');
    console.log('   4. Tiết kiệm thời gian');
    console.log('\n🌐 Truy cập: http://localhost:3000/app (Tab "Phân tích")');
    
  } else {
    console.log('⚠️ Chưa có bài đăng nào.');
  }
}

verifyAnalyticsData().catch(console.error);

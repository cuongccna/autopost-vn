// Debug Analytics API
async function debugAnalytics() {
  console.log('\n🔍 Debug Analytics API\n');
  
  const workspaceId = 'ed172ece-2dc6-4ee2-b1cf-0c1301681650';
  const url = `http://localhost:3000/api/analytics?workspace_id=${workspaceId}`;
  
  console.log('📡 Fetching:', url);
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    
    console.log(`\n📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.log('\n❌ Error Response:', text);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n✅ Response Data:\n');
    console.log(JSON.stringify(data, null, 2));
    
    // Analyze
    console.log('\n📈 Analysis:');
    console.log(`   Summary exists: ${data.summary ? '✅' : '❌'}`);
    console.log(`   Insights count: ${data.insights?.length || 0}`);
    console.log(`   Best times count: ${data.best_posting_times?.length || 0}`);
    
    if (data.summary) {
      console.log('\n📊 Summary:');
      console.log(`   Total posts: ${data.summary.total_posts}`);
      console.log(`   Total engagement: ${data.summary.total_engagement}`);
      console.log(`   Avg engagement rate: ${data.summary.avg_engagement_rate}%`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

debugAnalytics();

// Simulate Analytics calculation logic

const posts = [
  {
    id: '1',
    title: '🎉 Chào cả nhà mình ơi!',
    providers: ['facebook', 'facebook', 'facebook', 'facebook'], // 4 Facebook Pages
    status: 'published'
  },
  {
    id: '2',
    title: 'Bạn là kế toán viên...',
    providers: [],
    status: 'draft'
  },
  {
    id: '3',
    title: 'Tại sao và Khi nào...',
    providers: [],
    status: 'draft'
  }
];

console.log('\n📊 Analytics Calculation Test\n');

// Count total schedules
const totalSchedules = posts.reduce((sum, post) => sum + (post.providers?.length || 0), 0);

// Count published schedules
const publishedSchedules = posts.reduce((sum, post) => {
  if (post.status === 'published') {
    return sum + (post.providers?.length || 0);
  }
  return sum;
}, 0);

// Calculate stats
const totalPosts = totalSchedules;
const successRate = totalPosts > 0 ? ((publishedSchedules / totalPosts) * 100).toFixed(1) : '0';

// Calculate time saved (12 min per schedule)
const minutesSaved = totalPosts * 12;

console.log('📈 Results:');
console.log(`   Total schedules: ${totalSchedules}`);
console.log(`   Published schedules: ${publishedSchedules}`);
console.log(`   Total posts (for display): ${totalPosts}`);
console.log(`   Success rate: ${successRate}%`);
console.log(`   Time saved: ${minutesSaved}m`);

console.log('\n✅ Expected UI Display:');
console.log(`   Tổng bài đăng: ${totalPosts}`);
console.log(`   Tỷ lệ thành công: ${successRate}%`);
console.log(`   Tiết kiệm thời gian: ${minutesSaved}m`);

console.log('\n🔍 Breakdown:');
console.log(`   - 1 post × 4 Facebook Pages = 4 schedules`);
console.log(`   - All 4 published = 100% success`);
console.log(`   - 4 schedules × 12 min = 48m saved`);

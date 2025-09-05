'use client';

import { useState } from 'react';
import StatsCards from '@/components/shared/StatsCards';
import TabSelector from '@/components/shared/TabSelector';
import ChannelStatsChart from '@/components/analytics/ChannelStatsChart';
import TimeSlotAnalytics from '@/components/analytics/TimeSlotAnalytics';
import ErrorAnalytics from '@/components/analytics/ErrorAnalytics';

interface Post {
  id: string;
  title: string;
  datetime: string;
  providers: string[];
  status: 'scheduled' | 'published' | 'failed';
  error?: string;
}

interface AnalyticsProps {
  posts: Post[];
  className?: string;
}

export default function Analytics({ posts, className = '' }: AnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [selectedTab, setSelectedTab] = useState('overview');

  const periods = [
    { id: '7days', label: '7 ngày' },
    { id: '30days', label: '30 ngày' },
    { id: '90days', label: '3 tháng' },
    { id: 'custom', label: 'Tùy chọn' }
  ];

  const tabs = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'engagement', label: 'Tương tác' },
    { id: 'timing', label: 'Thời gian' },
    { id: 'errors', label: 'Lỗi' }
  ];

  // Calculate aggregate stats
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published').length;
  const successRate = totalPosts > 0 ? ((publishedPosts / totalPosts) * 100).toFixed(1) : '0';

  // Calculate channel data first (needed for engagement calculation)
  const channelData = ['facebook', 'instagram', 'zalo'].map(provider => {
    const providerPosts = posts.filter(p => p.providers.includes(provider));
    const providerSuccess = providerPosts.filter(p => p.status === 'published');
    const providerFailed = providerPosts.filter(p => p.status === 'failed');
    
    // Calculate realistic engagement based on provider and published posts
    const calculateProviderEngagement = () => {
      if (providerSuccess.length === 0) return 0;
      
      // Different engagement rates by platform (mock realistic data)
      const baseEngagementRates = {
        facebook: 350,   // Lower organic reach
        instagram: 650,  // Higher engagement
        zalo: 450       // Medium engagement
      };
      
      const baseRate = baseEngagementRates[provider as keyof typeof baseEngagementRates] || 400;
      const variance = Math.floor(Math.random() * 200) - 100;
      return Math.max(0, providerSuccess.length * (baseRate + variance));
    };
    
    return {
      provider,
      name: provider === 'facebook' ? 'Facebook' : provider === 'instagram' ? 'Instagram' : 'Zalo',
      posts: providerPosts.length,
      success: providerSuccess.length,
      failed: providerFailed.length,
      successRate: providerPosts.length > 0 ? Math.round((providerSuccess.length / providerPosts.length) * 100) : 0,
      engagement: calculateProviderEngagement()
    };
  });

  // Calculate average engagement based on channel data
  const calculateAverageEngagement = () => {
    if (publishedPosts === 0) return '0';
    
    const totalEngagement = channelData.reduce((sum, channel) => sum + channel.engagement, 0);
    const averageEngagement = Math.round(totalEngagement / Math.max(publishedPosts, 1));
    
    if (averageEngagement >= 1000) {
      return `${(averageEngagement / 1000).toFixed(1)}K`;
    }
    return averageEngagement.toString();
  };

  // Calculate time saved based on posts and automation
  const calculateTimeSaved = () => {
    // Assumption: Each manual post takes ~15 minutes (research, create, schedule)
    // Automated posting saves ~12 minutes per post (still need 3 min for content creation)
    const minutesSavedPerPost = 12;
    const totalMinutesSaved = totalPosts * minutesSavedPerPost;
    
    if (totalMinutesSaved >= 60) {
      const hours = Math.floor(totalMinutesSaved / 60);
      const remainingMinutes = totalMinutesSaved % 60;
      
      if (remainingMinutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h${remainingMinutes}m`;
      }
    }
    
    return `${totalMinutesSaved}m`;
  };

  const mockStats = [
    {
      label: 'Tổng bài đăng',
      value: totalPosts.toString(),
    },
    {
      label: 'Tỷ lệ thành công',
      value: `${successRate}%`,
    },
    {
      label: 'Tương tác TB',
      value: calculateAverageEngagement(),
    },
    {
      label: 'Tiết kiệm thời gian',
      value: calculateTimeSaved(),
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Phân tích & Báo cáo</h2>
          <p className="text-gray-600">Theo dõi hiệu suất và tối ưu hóa chiến lược đăng bài</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {periods.map(period => (
              <option key={period.id} value={period.id}>{period.label}</option>
            ))}
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={mockStats} />

      {/* Tabs */}
      <TabSelector
        tabs={tabs}
        currentTab={selectedTab}
        onTabChange={setSelectedTab}
      />

      {/* Content */}
      <div className="min-h-[500px]">
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChannelStatsChart posts={posts} />
            
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Xu hướng tương tác</h3>
              <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex flex-col items-center justify-center text-gray-600">
                <div className="text-4xl mb-2">📈</div>
                <div className="font-medium">Biểu đồ đường xu hướng</div>
                <div className="text-sm mt-1">Theo dõi engagement theo thời gian</div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'engagement' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Tỷ lệ tương tác</h3>
              <div className="h-64 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl flex flex-col items-center justify-center text-gray-600">
                <div className="text-4xl mb-2">❤️</div>
                <div className="font-medium">Engagement Rate</div>
                <div className="text-sm mt-1">Phân tích like, comment, share</div>
              </div>
            </div>
            
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Top bài đăng</h3>
              <div className="h-64 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl flex flex-col items-center justify-center text-gray-600">
                <div className="text-4xl mb-2">🏆</div>
                <div className="font-medium">Bài viết nổi bật</div>
                <div className="text-sm mt-1">Xếp hạng theo tương tác</div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'timing' && (
          <TimeSlotAnalytics posts={posts} />
        )}

        {selectedTab === 'errors' && (
          <ErrorAnalytics posts={posts} />
        )}
      </div>
    </div>
  );
}

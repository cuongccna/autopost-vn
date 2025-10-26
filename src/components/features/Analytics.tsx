'use client';

import { useState, useEffect } from 'react';
import StatsCards from '@/components/shared/StatsCards';
import TabSelector from '@/components/shared/TabSelector';
import ChannelStatsChart from '@/components/analytics/ChannelStatsChart';
import TimeSlotAnalytics from '@/components/analytics/TimeSlotAnalytics';
import ErrorAnalytics from '@/components/analytics/ErrorAnalytics';
import EngagementTrendChart from '@/components/analytics/EngagementTrendChart';

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

interface PostInsight {
  platform_post_id: string;
  platform: string;
  published_at: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  engagement_rate: number;
}

interface AnalyticsSummary {
  total_posts: number;
  total_engagement: number;
  avg_engagement_rate: number;
  total_reach: number;
  total_impressions: number;
}

interface BestPostingTime {
  day_of_week: string;
  hour: number;
  avg_engagement: number;
  post_count: number;
}

export default function Analytics({ posts, className = '' }: AnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState<{
    summary: AnalyticsSummary | null;
    insights: PostInsight[];
    best_posting_times: BestPostingTime[];
  }>({
    summary: null,
    insights: [],
    best_posting_times: []
  });
  const [loading, setLoading] = useState(true);

  // Fetch analytics data from API
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const workspaceId = localStorage.getItem('current_workspace_id') || 'ed172ece-2dc6-4ee2-b1cf-0c1301681650';
        const response = await fetch(`/api/analytics?workspace_id=${workspaceId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Analytics API Response:', data);
          console.log('📈 Insights:', data.insights);
          console.log('📋 Summary:', data.summary);
          setAnalyticsData({
            summary: data.summary || null,
            insights: data.insights || [],
            best_posting_times: data.best_posting_times || []
          });
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

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

  // Use real data from API if available, otherwise calculate from posts
  // Count total schedules (each post can be published to multiple platforms)
  const totalSchedules = posts.reduce((sum, post) => sum + (post.providers?.length || 0), 0);
  
  // Count published schedules
  const publishedSchedules = posts.reduce((sum, post) => {
    if (post.status === 'published') {
      return sum + (post.providers?.length || 0);
    }
    return sum;
  }, 0);
  
  // Use API data if available, otherwise use calculated schedules
  const totalPosts = analyticsData.summary?.total_posts || totalSchedules;
  const successRate = totalPosts > 0 ? ((publishedSchedules / totalPosts) * 100).toFixed(1) : '0';
  
  // Calculate total engagement from insights if available
  const insightsEngagement = analyticsData.insights.reduce(
    (sum, insight) => sum + (insight.likes + insight.comments + insight.shares), 
    0
  );
  
  // Calculate average engagement rate from insights
  const insightsAvgEngagementRate = analyticsData.insights.length > 0
    ? analyticsData.insights.reduce((sum, insight) => sum + (insight.engagement_rate || 0), 0) / analyticsData.insights.length
    : 0;
  
  // Use real engagement data
  const totalEngagement = analyticsData.summary?.total_engagement || insightsEngagement;
  const avgEngagementRate = analyticsData.summary?.avg_engagement_rate || insightsAvgEngagementRate;

  // Calculate channel data using real insights
  const channelData = ['facebook', 'instagram', 'zalo'].map(provider => {
    const providerPosts = posts.filter(p => p.providers.includes(provider));
    const providerSuccess = providerPosts.filter(p => p.status === 'published');
    const providerFailed = providerPosts.filter(p => p.status === 'failed');
    
    // Get real engagement from insights
    const providerInsights = analyticsData.insights.filter(
      i => i.platform === provider || i.platform === `${provider}_page`
    );
    const providerEngagement = providerInsights.reduce(
      (sum, insight) => sum + (insight.likes + insight.comments + insight.shares), 
      0
    );
    
    return {
      provider,
      name: provider === 'facebook' ? 'Facebook' : provider === 'instagram' ? 'Instagram' : 'Zalo',
      posts: providerPosts.length,
      success: providerSuccess.length,
      failed: providerFailed.length,
      successRate: providerPosts.length > 0 ? Math.round((providerSuccess.length / providerPosts.length) * 100) : 0,
      engagement: providerEngagement
    };
  });

  // Format average engagement for display
  const formatEngagement = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
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
      value: loading ? '...' : (publishedSchedules > 0 ? formatEngagement(Math.round(totalEngagement / publishedSchedules)) : '0'),
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
              <EngagementTrendChart insights={analyticsData.insights} />
            </div>
          </div>
        )}

        {selectedTab === 'engagement' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Tỷ lệ tương tác</h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : analyticsData.insights.length > 0 ? (
                <div className="space-y-4">
                  {avgEngagementRate > 0 ? (
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-pink-600 mb-2">
                          {avgEngagementRate.toFixed(2)}%
                        </div>
                        <div className="text-gray-600">Tỷ lệ tương tác trung bình</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6">
                      <div className="text-center">
                        <div className="text-4xl mb-2">⏳</div>
                        <div className="text-lg font-semibold text-gray-700 mb-2">
                          Đang chờ Facebook tạo insights
                        </div>
                        <div className="text-sm text-gray-600">
                          Facebook cần 15-30 phút sau khi đăng bài để tạo dữ liệu phân tích.
                          Hiện tại chỉ có thể hiển thị số lượng tương tác cơ bản.
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {formatEngagement(analyticsData.insights.reduce((sum, i) => sum + i.likes, 0))}
                      </div>
                      <div className="text-sm text-gray-600">Likes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatEngagement(analyticsData.insights.reduce((sum, i) => sum + i.comments, 0))}
                      </div>
                      <div className="text-sm text-gray-600">Comments</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatEngagement(analyticsData.insights.reduce((sum, i) => sum + i.shares, 0))}
                      </div>
                      <div className="text-sm text-gray-600">Shares</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl flex flex-col items-center justify-center text-gray-600">
                  <div className="text-4xl mb-2">❤️</div>
                  <div className="font-medium">Engagement Rate</div>
                  <div className="text-sm mt-1">Chưa có dữ liệu tương tác</div>
                </div>
              )}
            </div>
            
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Top bài đăng</h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : analyticsData.insights.length > 0 ? (
                <div className="space-y-3">
                  {analyticsData.insights
                    .sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares))
                    .slice(0, 5)
                    .map((insight, index) => (
                      <div key={insight.platform_post_id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-400 text-white flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {new Date(insight.published_at).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="text-xs text-gray-600">
                            {insight.likes + insight.comments + insight.shares} tương tác
                          </div>
                        </div>
                        <div className="text-right">
                          {(insight.engagement_rate || 0) > 0 ? (
                            <div className="text-sm font-semibold text-green-600">
                              {(insight.engagement_rate || 0).toFixed(1)}%
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">
                              <div className="flex gap-1">
                                <span>❤️ {insight.likes}</span>
                                <span>💬 {insight.comments}</span>
                                <span>↗️ {insight.shares}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="h-64 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl flex flex-col items-center justify-center text-gray-600">
                  <div className="text-4xl mb-2">🏆</div>
                  <div className="font-medium">Bài viết nổi bật</div>
                  <div className="text-sm mt-1">Chưa có dữ liệu</div>
                </div>
              )}
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

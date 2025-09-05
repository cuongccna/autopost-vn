'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGate from '@/components/shared/PermissionGate';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Download,
  FileText,
  Crown,
  Calendar,
  Users,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
  };
  performance: {
    bestPost: {
      id: string;
      content: string;
      platform: string;
      engagement: number;
      date: string;
    };
    topPlatform: {
      name: string;
      percentage: number;
    };
  };
  trends: {
    viewsGrowth: number;
    engagementGrowth: number;
    followersGrowth: number;
  };
  platformBreakdown: {
    platform: string;
    posts: number;
    views: number;
    engagement: number;
  }[];
}

export default function AnalyticsDashboard() {
  const { hasFeature, userRole } = usePermissions();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  const canViewAdvanced = hasFeature('analytics', 'advanced');
  const canExportPDF = hasFeature('analytics', 'pdfExport');

  useEffect(() => {
    // Mock analytics data - replace with actual API call
    const mockData: AnalyticsData = {
      overview: {
        totalPosts: 45,
        totalViews: 12500,
        totalLikes: 3200,
        totalComments: 890,
        totalShares: 540,
      },
      performance: {
        bestPost: {
          id: '1',
          content: 'Sale cuối tuần - Giảm đến 50% tất cả sản phẩm!',
          platform: 'Facebook',
          engagement: 85.6,
          date: '2024-01-10',
        },
        topPlatform: {
          name: 'Facebook',
          percentage: 65,
        },
      },
      trends: {
        viewsGrowth: 23.5,
        engagementGrowth: 18.2,
        followersGrowth: 12.8,
      },
      platformBreakdown: [
        { platform: 'Facebook', posts: 20, views: 8500, engagement: 12.5 },
        { platform: 'Instagram', posts: 15, views: 2800, engagement: 15.2 },
        { platform: 'Zalo', posts: 8, views: 1000, engagement: 8.9 },
        { platform: 'TikTok', posts: 2, views: 200, engagement: 25.0 },
      ],
    };

    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Exporting analytics to PDF...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Đang tải analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Không có dữ liệu analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
            <option value="90d">3 tháng qua</option>
          </select>

          {/* PDF Export */}
          <PermissionGate
            feature="analytics"
            subFeature="pdfExport"
            fallback={
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Xuất PDF (Premium)
              </button>
            }
          >
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Xuất PDF
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          icon={<FileText className="w-5 h-5 text-blue-600" />}
          label="Tổng bài đăng"
          value={data.overview.totalPosts}
          format="number"
        />
        <MetricCard
          icon={<Eye className="w-5 h-5 text-green-600" />}
          label="Lượt xem"
          value={data.overview.totalViews}
          format="number"
          growth={data.trends.viewsGrowth}
        />
        <MetricCard
          icon={<Heart className="w-5 h-5 text-red-600" />}
          label="Lượt thích"
          value={data.overview.totalLikes}
          format="number"
        />
        <MetricCard
          icon={<MessageCircle className="w-5 h-5 text-purple-600" />}
          label="Bình luận"
          value={data.overview.totalComments}
          format="number"
        />
        <MetricCard
          icon={<Share2 className="w-5 h-5 text-orange-600" />}
          label="Chia sẻ"
          value={data.overview.totalShares}
          format="number"
        />
      </div>

      {/* Basic Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Performing Post */}
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bài đăng hiệu quả nhất</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">{data.performance.bestPost.content}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{data.performance.bestPost.platform}</span>
                <span>{new Date(data.performance.bestPost.date).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tỷ lệ tương tác</span>
              <span className="text-lg font-semibold text-green-600">
                {data.performance.bestPost.engagement}%
              </span>
            </div>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Phân bố theo nền tảng</h3>
          <div className="space-y-3">
            {data.platformBreakdown.map((platform, index) => (
              <div key={platform.platform} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-purple-500' :
                    index === 2 ? 'bg-green-500' : 'bg-orange-500'
                  }`} />
                  <span className="text-sm font-medium">{platform.platform}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{platform.posts} bài</div>
                  <div className="text-xs text-gray-500">{platform.views.toLocaleString()} views</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Analytics */}
      <PermissionGate feature="analytics" subFeature="advanced">
        <div className="space-y-6">
          {/* Growth Trends */}
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Xu hướng tăng trưởng</h3>
              <Crown className="w-4 h-4 text-yellow-600" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TrendCard
                label="Lượt xem"
                value={data.trends.viewsGrowth}
                trend="up"
              />
              <TrendCard
                label="Tương tác"
                value={data.trends.engagementGrowth}
                trend="up"
              />
              <TrendCard
                label="Người theo dõi"
                value={data.trends.followersGrowth}
                trend="up"
              />
            </div>
          </div>

          {/* Detailed Platform Performance */}
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-medium text-gray-900">Hiệu suất chi tiết theo nền tảng</h3>
              <Crown className="w-4 h-4 text-yellow-600" />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-medium text-gray-900">Nền tảng</th>
                    <th className="text-right py-3 font-medium text-gray-900">Bài đăng</th>
                    <th className="text-right py-3 font-medium text-gray-900">Lượt xem</th>
                    <th className="text-right py-3 font-medium text-gray-900">Tương tác (%)</th>
                    <th className="text-right py-3 font-medium text-gray-900">Hiệu quả</th>
                  </tr>
                </thead>
                <tbody>
                  {data.platformBreakdown.map((platform, index) => (
                    <tr key={platform.platform} className="border-b border-gray-100">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            index === 0 ? 'bg-blue-500' :
                            index === 1 ? 'bg-purple-500' :
                            index === 2 ? 'bg-green-500' : 'bg-orange-500'
                          }`} />
                          {platform.platform}
                        </div>
                      </td>
                      <td className="text-right py-3">{platform.posts}</td>
                      <td className="text-right py-3">{platform.views.toLocaleString()}</td>
                      <td className="text-right py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          platform.engagement > 15 ? 'bg-green-100 text-green-700' :
                          platform.engagement > 10 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {platform.engagement}%
                        </span>
                      </td>
                      <td className="text-right py-3">
                        <div className="flex justify-end">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 h-3 mx-px rounded ${
                                i < Math.floor(platform.engagement / 5) ? 'bg-blue-500' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PermissionGate>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  format: 'number' | 'currency' | 'percentage';
  growth?: number;
}

function MetricCard({ icon, label, value, format, growth }: MetricCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900">{formatValue(value)}</span>
        {growth !== undefined && (
          <span className={`text-xs flex items-center gap-1 ${
            growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            <TrendingUp className={`w-3 h-3 ${growth < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(growth)}%
          </span>
        )}
      </div>
    </div>
  );
}

interface TrendCardProps {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'neutral';
}

function TrendCard({ label, value, trend }: TrendCardProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <TrendingUp className={`w-4 h-4 ${
          trend === 'up' ? 'text-green-600' :
          trend === 'down' ? 'text-red-600 rotate-180' :
          'text-gray-600'
        }`} />
      </div>
      <div className="text-2xl font-bold text-blue-900">+{value}%</div>
      <div className="text-xs text-blue-700">So với kỳ trước</div>
    </div>
  );
}

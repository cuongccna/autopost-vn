'use client';

import { useMemo } from 'react';

interface PostInsight {
  platform_post_id: string;
  published_at: string;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
}

interface EngagementTrendChartProps {
  insights: PostInsight[];
}

export default function EngagementTrendChart({ insights }: EngagementTrendChartProps) {
  // Group insights by date and calculate total engagement
  const trendData = useMemo(() => {
    if (!insights || insights.length === 0) return [];
    
    // Group by date
    const groupedByDate = insights.reduce((acc, insight) => {
      const date = new Date(insight.published_at).toLocaleDateString('vi-VN');
      if (!acc[date]) {
        acc[date] = {
          date,
          likes: 0,
          comments: 0,
          shares: 0,
          total: 0,
          count: 0
        };
      }
      acc[date].likes += insight.likes;
      acc[date].comments += insight.comments;
      acc[date].shares += insight.shares;
      acc[date].total += (insight.likes + insight.comments + insight.shares);
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, any>);
    
    // Convert to array and sort by date
    return Object.values(groupedByDate).sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [insights]);

  const maxEngagement = useMemo(() => {
    if (trendData.length === 0) return 0;
    return Math.max(...trendData.map((d: any) => d.total));
  }, [trendData]);

  // Check if there's any actual engagement data
  const totalEngagement = useMemo(() => {
    return insights.reduce((sum, insight) => sum + insight.likes + insight.comments + insight.shares, 0);
  }, [insights]);

  if (!insights || insights.length === 0 || totalEngagement === 0) {
    return (
      <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex flex-col items-center justify-center text-gray-600">
        <div className="text-4xl mb-2">📈</div>
        <div className="font-medium">Biểu đồ đường xu hướng</div>
        <div className="text-sm mt-1">Chưa có dữ liệu tương tác</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-48 flex items-end gap-2 px-4">
        {trendData.map((data: any, index) => {
          const height = maxEngagement > 0 ? (data.total / maxEngagement) * 100 : 0;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              {/* Bar */}
              <div className="w-full relative group cursor-pointer">
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 transition-all"
                  style={{ height: `${Math.max(height, 2)}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                      <div className="font-semibold mb-1">{data.date}</div>
                      <div className="space-y-0.5">
                        <div>👍 {data.likes} likes</div>
                        <div>💬 {data.comments} comments</div>
                        <div>↗️ {data.shares} shares</div>
                        <div className="border-t border-gray-700 pt-1 mt-1">
                          <strong>Tổng: {data.total}</strong>
                        </div>
                      </div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Date label */}
              <div className="text-xs text-gray-600 rotate-45 origin-left whitespace-nowrap mt-4">
                {data.date}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600">Tổng tương tác</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Cao nhất: <strong>{maxEngagement}</strong></span>
        </div>
      </div>

      {/* Stats breakdown */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {trendData.reduce((sum: number, d: any) => sum + d.likes, 0)}
          </div>
          <div className="text-xs text-gray-600 mt-1">Tổng Likes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {trendData.reduce((sum: number, d: any) => sum + d.comments, 0)}
          </div>
          <div className="text-xs text-gray-600 mt-1">Tổng Comments</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {trendData.reduce((sum: number, d: any) => sum + d.shares, 0)}
          </div>
          <div className="text-xs text-gray-600 mt-1">Tổng Shares</div>
        </div>
      </div>
    </div>
  );
}

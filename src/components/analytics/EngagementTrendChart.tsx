'use client';

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

interface PostInsight {
  platform_post_id: string;
  published_at: string;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate?: number;
}

interface EngagementTrendChartProps {
  insights: PostInsight[];
}

export default function EngagementTrendChart({ insights }: EngagementTrendChartProps) {
  // Chuẩn hóa dữ liệu
  const chartData = useMemo(() => {
    if (!insights || insights.length === 0) return [];
    // Group by date (YYYY-MM-DD)
    const grouped: Record<string, { date: string, likes: number, comments: number, shares: number, total: number }> = {};
    insights.forEach(insight => {
      const date = new Date(insight.published_at).toLocaleDateString('vi-VN');
      if (!grouped[date]) grouped[date] = { date, likes: 0, comments: 0, shares: 0, total: 0 };
      grouped[date].likes += insight.likes;
      grouped[date].comments += insight.comments;
      grouped[date].shares += insight.shares;
      grouped[date].total += insight.likes + insight.comments + insight.shares;
    });
    return Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [insights]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex flex-col items-center justify-center text-gray-600">
        <div className="text-4xl mb-2">📈</div>
        <div className="font-medium">Biểu đồ xu hướng tương tác</div>
        <div className="text-sm mt-1">Không có dữ liệu tương tác</div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 16, right: 24, left: 8, bottom: 16 }} >
        <CartesianGrid stroke="#f3f3f3" strokeDasharray="3 3" />
        <XAxis dataKey="date" stroke="#888" fontSize={12} angle={-30} dy={20} />
        <YAxis allowDecimals={false} fontSize={12} />
        <Tooltip formatter={(value:any, name:string) => [`${value}`,
          name === 'likes' ? 'Likes' : name === 'comments' ? 'Comments' : name === 'shares' ? 'Shares' : 'Tổng' ]} />
        <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Tổng tương tác" />
        <Line type="monotone" dataKey="likes" stroke="#10b981" strokeDasharray="5 2" dot={false} name="Likes" />
        <Line type="monotone" dataKey="comments" stroke="#6366f1" strokeDasharray="3 3" dot={false} name="Comments" />
        <Line type="monotone" dataKey="shares" stroke="#f59e42" strokeDasharray="3 3" dot={false} name="Shares" />
      </LineChart>
    </ResponsiveContainer>
  );
}

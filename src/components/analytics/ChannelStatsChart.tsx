'use client';

import { useMemo } from 'react';

interface Post {
  id: string;
  title: string;
  datetime: string;
  providers: string[];
  status: 'scheduled' | 'published' | 'failed';
}

interface ChannelStatsChartProps {
  posts: Post[];
}

export default function ChannelStatsChart({ posts }: ChannelStatsChartProps) {
  const channelStats = useMemo(() => {
    const stats = {
      fb: { total: 0, success: 0, failed: 0 },
      ig: { total: 0, success: 0, failed: 0 },
      zalo: { total: 0, success: 0, failed: 0 }
    };

    posts.forEach(post => {
      post.providers.forEach(provider => {
        if (provider in stats) {
          const key = provider as keyof typeof stats;
          stats[key].total++;
          if (post.status === 'published') stats[key].success++;
          if (post.status === 'failed') stats[key].failed++;
        }
      });
    });

    return Object.entries(stats).map(([key, data]) => ({
      provider: key,
      name: key === 'fb' ? 'Facebook' : key === 'ig' ? 'Instagram' : 'Zalo',
      total: data.total,
      success: data.success,
      failed: data.failed,
      scheduled: data.total - data.success - data.failed,
      successRate: data.total > 0 ? Math.round((data.success / data.total) * 100) : 0,
      color: key === 'fb' ? 'bg-blue-500' : key === 'ig' ? 'bg-pink-500' : 'bg-sky-500'
    }));
  }, [posts]);

  const maxTotal = Math.max(...channelStats.map(s => s.total), 1);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Tương tác theo kênh</h3>
        <p className="text-sm text-gray-600">Phân tích hiệu suất đăng bài trên từng nền tảng</p>
      </div>

      <div className="space-y-6">
        {channelStats.map((stat) => (
          <div key={stat.provider} className="space-y-2">
            {/* Channel header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                <span className="font-medium">{stat.name}</span>
                <span className="text-sm text-gray-500">({stat.total} bài)</span>
              </div>
              <div className="text-sm font-medium text-green-600">
                {stat.successRate}% thành công
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-6 bg-gray-100 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex">
                {/* Success */}
                <div 
                  className="bg-emerald-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${(stat.success / maxTotal) * 100}%` }}
                >
                  {stat.success > 0 && stat.success}
                </div>
                {/* Scheduled */}
                <div 
                  className="bg-amber-400 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${(stat.scheduled / maxTotal) * 100}%` }}
                >
                  {stat.scheduled > 0 && stat.scheduled}
                </div>
                {/* Failed */}
                <div 
                  className="bg-red-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${(stat.failed / maxTotal) * 100}%` }}
                >
                  {stat.failed > 0 && stat.failed}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded"></div>
                <span>Thành công ({stat.success})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded"></div>
                <span>Chờ đăng ({stat.scheduled})</span>
              </div>
              {stat.failed > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded"></div>
                  <span>Thất bại ({stat.failed})</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {channelStats.every(s => s.total === 0) && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <div>Chưa có dữ liệu để hiển thị biểu đồ</div>
          <div className="text-sm mt-1">Tạo một số bài đăng để xem analytics</div>
        </div>
      )}
    </div>
  );
}

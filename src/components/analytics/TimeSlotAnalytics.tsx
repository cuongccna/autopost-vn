'use client';

import { useMemo } from 'react';

interface Post {
  id: string;
  title: string;
  datetime: string;
  providers: string[];
  status: 'scheduled' | 'published' | 'failed';
}

interface TimeSlotAnalyticsProps {
  posts: Post[];
  goldenHours?: string[];
}

export default function TimeSlotAnalytics({ posts, goldenHours = ['09:00', '12:30', '20:00'] }: TimeSlotAnalyticsProps) {
  const timeSlotData = useMemo(() => {
    // Create 24-hour slots
    const slots = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      posts: 0,
      success: 0,
      failed: 0,
      successRate: 0,
      isGolden: goldenHours.some(gh => parseInt(gh.split(':')[0]) === hour)
    }));

    // Populate with actual data
    posts.forEach(post => {
      const date = new Date(post.datetime);
      const hour = date.getHours();
      
      slots[hour].posts++;
      if (post.status === 'published') slots[hour].success++;
      if (post.status === 'failed') slots[hour].failed++;
    });

    // Calculate success rates
    slots.forEach(slot => {
      slot.successRate = slot.posts > 0 ? Math.round((slot.success / slot.posts) * 100) : 0;
    });

    return slots;
  }, [posts, goldenHours]);

  const maxPosts = Math.max(...timeSlotData.map(s => s.posts), 1);
  const avgSuccessRate = timeSlotData.reduce((acc, slot) => acc + slot.successRate, 0) / timeSlotData.length;
  
  // Get top performing hours
  const topHours = [...timeSlotData]
    .filter(slot => slot.posts > 0)
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 3);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Khung giờ hiệu quả</h3>
        <p className="text-sm text-gray-600">Phân tích hiệu suất đăng bài theo từng giờ trong ngày</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
          <div className="text-sm text-emerald-600 font-medium">Tỷ lệ thành công TB</div>
          <div className="text-2xl font-bold text-emerald-700">{Math.round(avgSuccessRate)}%</div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
          <div className="text-sm text-indigo-600 font-medium">Giờ hoạt động</div>
          <div className="text-2xl font-bold text-indigo-700">
            {timeSlotData.filter(s => s.posts > 0).length}/24
          </div>
        </div>
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4">
          <div className="text-sm text-amber-600 font-medium">Giờ vàng hiệu quả</div>
          <div className="text-2xl font-bold text-amber-700">
            {timeSlotData.filter(s => s.isGolden && s.successRate > avgSuccessRate).length}/3
          </div>
        </div>
      </div>

      {/* Hourly heatmap */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Bản đồ nhiệt hoạt động (24h)</h4>
        <div className="grid grid-cols-12 gap-1">
          {timeSlotData.map((slot) => {
            const intensity = slot.posts / maxPosts;
            const opacity = Math.max(0.1, intensity);
            
            return (
              <div
                key={slot.hour}
                className={`relative aspect-square rounded-lg border-2 transition-all hover:scale-105 cursor-pointer ${
                  slot.isGolden ? 'border-amber-300' : 'border-gray-200'
                }`}
                style={{
                  backgroundColor: slot.posts > 0 
                    ? slot.successRate >= avgSuccessRate 
                      ? `rgba(34, 197, 94, ${opacity})` // green for good performance
                      : `rgba(239, 68, 68, ${opacity})` // red for poor performance
                    : 'rgba(156, 163, 175, 0.1)', // gray for no data
                }}
                title={`${slot.label}: ${slot.posts} bài, ${slot.successRate}% thành công${slot.isGolden ? ' (Giờ vàng)' : ''}`}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-medium">
                  <div>{slot.hour}</div>
                  {slot.posts > 0 && (
                    <div className="text-[10px] opacity-75">{slot.posts}</div>
                  )}
                </div>
                {slot.isGolden && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>00:00</span>
          <span>12:00</span>
          <span>23:00</span>
        </div>
      </div>

      {/* Top performing hours */}
      {topHours.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Top 3 khung giờ hiệu quả nhất</h4>
          <div className="space-y-2">
            {topHours.map((slot, index) => (
              <div key={slot.hour} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{slot.label}</div>
                    <div className="text-sm text-gray-600">{slot.posts} bài đã đăng</div>
                  </div>
                  {slot.isGolden && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                      ⭐ Giờ vàng
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{slot.successRate}%</div>
                  <div className="text-xs text-gray-500">thành công</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">⏰</div>
          <div>Chưa có dữ liệu thời gian</div>
          <div className="text-sm mt-1">Đăng một số bài để phân tích khung giờ hiệu quả</div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t">
        <div className="text-xs text-gray-600 mb-2">Chú thích:</div>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span>Hiệu suất cao</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <span>Hiệu suất thấp</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-amber-300 rounded"></div>
            <span>Giờ vàng</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
            <span>Đang là giờ vàng</span>
          </div>
        </div>
      </div>
    </div>
  );
}

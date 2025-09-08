'use client';

import { useState, useEffect } from 'react';
import { PROVIDERS } from '@/lib/constants';

interface ComposeData {
  title: string;
  content: string;
  channels: string[];
  scheduleAt: string;
  mediaUrls: string[];
  postId?: string;
  metadata?: {
    type?: 'social' | 'video';
    platform: string;
    ratio: string;
    hashtags?: string;
    cta?: string;
    brandColor?: string;
    template?: string;
    duration?: number;
    hook?: string;
    beats?: { time: number; text: string; }[];
    sub?: string;
    overlayCTA?: string;
  };
}

interface ComposeRightPanelProps {
  composeData: Partial<ComposeData>;
  onDataChange: (data: Partial<ComposeData>) => void;
  rateLimitData?: any;
  getRateLimitMessage?: (data: any) => string;
}

// Golden hours for optimal posting times
const goldenHours = [
  '07:00', '08:00', '09:00',
  '12:00', '13:00', '14:00',
  '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00'
];

export default function ComposeRightPanel({
  composeData,
  onDataChange,
  rateLimitData,
  getRateLimitMessage
}: ComposeRightPanelProps) {
  // Debug logs
  console.log('🔍 ComposeRightPanel - rateLimitData:', rateLimitData);
  console.log('🔍 ComposeRightPanel - getRateLimitMessage:', getRateLimitMessage);
  
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(
    new Set(composeData.channels || ['facebook', 'instagram'])
  );

  const [scheduleAt, setScheduleAt] = useState(composeData.scheduleAt || '');

  // Update parent when channels change
  useEffect(() => {
    onDataChange({
      ...composeData,
      channels: Array.from(selectedChannels)
    });
  }, [selectedChannels]);

  // Update parent when schedule changes
  useEffect(() => {
    onDataChange({
      ...composeData,
      scheduleAt
    });
  }, [scheduleAt]);

  const platforms = [
    {
      key: 'facebook',
      name: 'Facebook Page',
      icon: '📘',
      status: selectedChannels.has('facebook'),
      description: 'Đăng lên Facebook Page'
    },
    {
      key: 'instagram', 
      name: 'Instagram Biz',
      icon: '📷',
      status: selectedChannels.has('instagram'),
      description: 'Đăng lên Instagram Biz'
    },
    {
      key: 'zalo',
      name: 'Zalo OA', 
      icon: '💬',
      status: selectedChannels.has('zalo'),
      description: 'Đăng lên Zalo OA'
    }
  ];

  const toggleChannel = (channelKey: string) => {
    const newChannels = new Set(selectedChannels);
    if (newChannels.has(channelKey)) {
      newChannels.delete(channelKey);
    } else {
      newChannels.add(channelKey);
    }
    setSelectedChannels(newChannels);
  };

  const handleQuickTime = (hour: string) => {
    const now = new Date();
    const [hourStr] = hour.split(':');
    const targetHour = parseInt(hourStr);
    
    // If target hour has passed today, schedule for tomorrow
    if (targetHour <= now.getHours()) {
      now.setDate(now.getDate() + 1);
    }
    
    now.setHours(targetHour, 0, 0, 0);
    
    const formatted = now.toISOString().slice(0, 16);
    setScheduleAt(formatted);
  };

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Publishing Channels */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Kênh đăng bài
        </h3>
        
        <div className="space-y-3">
          {Object.entries(PROVIDERS).map(([key, provider]) => (
            <label
              key={key}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedChannels.has(key)}
                onChange={() => toggleChannel(key)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {provider.label}
                </div>
                <div className="text-sm text-gray-500">
                  Đăng lên {provider.label}
                </div>
              </div>
              <div className="text-2xl">
                {key === 'facebook' ? '📘' : key === 'instagram' ? '📷' : '�'}
              </div>
            </label>
          ))}
        </div>

        {selectedChannels.size === 0 && (
          <div className="mt-3 text-sm text-red-600">
            ⚠️ Vui lòng chọn ít nhất một kênh đăng bài
          </div>
        )}
      </div>

      {/* Scheduling */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Lên lịch đăng bài
        </h3>
        
        {/* Quick Time Slots */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Khung giờ vàng
          </label>
          <div className="grid grid-cols-3 gap-2">
            {goldenHours.map((hour) => (
              <button
                key={hour}
                onClick={() => handleQuickTime(hour)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                {hour}
              </button>
            ))}
          </div>
        </div>

        {/* Custom DateTime */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hoặc chọn thời gian tùy chỉnh
          </label>
          <input
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Schedule Preview */}
        {scheduleAt && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-900">
              📅 Đăng vào: {formatDateTime(scheduleAt)}
            </div>
            <div className="text-xs text-blue-700 mt-1">
              Bài viết sẽ được đăng tự động vào thời gian đã chọn
            </div>
          </div>
        )}

        {/* Post Now Option */}
        <div className="mt-4">
          <button
            onClick={() => setScheduleAt('')}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
          >
            🚀 Đăng ngay lập tức
          </button>
        </div>
      </div>

      {/* Rate Limit Status */}
      {rateLimitData && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Trạng thái giới hạn
          </h3>
          
          <div className={`p-3 rounded-lg ${
            rateLimitData.allowed 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`flex items-center gap-2 text-sm font-medium ${
              rateLimitData.allowed ? 'text-green-800' : 'text-red-800'
            }`}>
              {rateLimitData.allowed ? '✅' : '🚫'}
              {getRateLimitMessage && getRateLimitMessage(rateLimitData)}
            </div>
            
            {/* Usage Stats */}
            {rateLimitData.stats && (
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Hôm nay:</span>
                  <span>
                    {rateLimitData.stats.dailyUsage || 0}/
                    {(() => {
                      const dailyLimits = { free: 1, professional: 10, enterprise: -1 };
                      const limit = dailyLimits[rateLimitData.stats.userRole as keyof typeof dailyLimits] || 1;
                      return limit === -1 ? '∞' : limit;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tháng này:</span>
                  <span>
                    {rateLimitData.stats.monthlyUsage || 0}/
                    {rateLimitData.stats.monthlyLimit === -1 ? '∞' : rateLimitData.stats.monthlyLimit || 0}
                  </span>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {rateLimitData.stats && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      rateLimitData.allowed ? 'bg-green-600' : 'bg-red-600'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (() => {
                          const dailyLimits = { free: 1, professional: 10, enterprise: -1 };
                          const limit = dailyLimits[rateLimitData.stats.userRole as keyof typeof dailyLimits] || 1;
                          if (limit === -1) return 0; // Unlimited
                          return ((rateLimitData.stats.dailyUsage || 0) / limit) * 100;
                        })()
                      )}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tóm tắt bài viết
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Tiêu đề:</span>
            <span className="font-medium max-w-40 truncate">
              {composeData.title || 'Chưa có tiêu đề'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Nền tảng:</span>
            <span className="font-medium">
              {composeData.metadata?.platform || 'Facebook Page'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Tỉ lệ:</span>
            <span className="font-medium">
              {composeData.metadata?.ratio || '1:1'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Kênh đăng:</span>
            <span className="font-medium">
              {selectedChannels.size} kênh
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Hình ảnh:</span>
            <span className="font-medium">
              {composeData.mediaUrls?.length || 0} ảnh
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Thời gian:</span>
            <span className="font-medium">
              {scheduleAt ? 'Đã lên lịch' : 'Đăng ngay'}
            </span>
          </div>
        </div>
      </div>

      {/* Help Tips */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Mẹo hay</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Đăng vào khung giờ vàng để tiếp cận tốt nhất</li>
          <li>• Sử dụng hashtag phù hợp với nội dung</li>
          <li>• Thêm CTA rõ ràng để tăng tương tác</li>
          <li>• Kiểm tra preview trước khi đăng</li>
        </ul>
      </div>
    </div>
  );
}

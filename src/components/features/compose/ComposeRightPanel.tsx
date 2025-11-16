'use client';

import { useState, useEffect } from 'react';
import { PROVIDERS } from '@/lib/constants';
import ContentPlanAssistant from '@/components/features/compose/ContentPlanAssistant';
import type { AIContentPlanDay, AIContentPlanSlot, AIContentPlanResponse } from '@/types/ai';
import { mapProvidersToAPI } from '@/lib/constants';

interface ComposeData {
  title: string;
  content: string;
  channels: string[];
  scheduleAt: string;
  mediaUrls: string[];
  postId?: string;
  aiContext?: string;
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
  showToast?: (options: { message: string; type: 'success' | 'error' | 'warning'; title?: string }) => void;
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
  getRateLimitMessage,
  showToast,
}: ComposeRightPanelProps) {
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(
    () => new Set(composeData.channels || ['facebook', 'instagram'])
  );

  const [scheduleAt, setScheduleAt] = useState(composeData.scheduleAt || '');

  useEffect(() => {
    if (composeData.scheduleAt !== undefined && composeData.scheduleAt !== scheduleAt) {
      setScheduleAt(composeData.scheduleAt);
    }
  }, [composeData.scheduleAt, scheduleAt]);

  useEffect(() => {
    if (!composeData.channels || composeData.channels.length === 0) {
      return;
    }

    setSelectedChannels(prev => {
      const isSame = composeData.channels &&
        composeData.channels.length === prev.size &&
        composeData.channels.every(channel => prev.has(channel));

      if (isSame) {
        return prev;
      }

      return new Set(composeData.channels);
    });
  }, [composeData.channels]);

  const toggleChannel = (channelKey: string) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(channelKey)) {
        next.delete(channelKey);
      } else {
        next.add(channelKey);
      }

      onDataChange({
        channels: Array.from(next)
      });

      return next;
    });
  };

  const providerExists = (platformKey: string): platformKey is keyof typeof PROVIDERS =>
    Object.prototype.hasOwnProperty.call(PROVIDERS, platformKey);

  const applyPlanSlot = async (day: AIContentPlanDay, slot: AIContentPlanSlot) => {
    const normalizedPlatform = slot.platform.toLowerCase();
    const normalizedTime = slot.time.length > 5 ? slot.time.slice(0, 5) : slot.time;
    
    // Parse date correctly - ensure it's in YYYY-MM-DD format
    let dateStr = day.date;
    
    // If date is in DD/MM/YYYY format, convert to YYYY-MM-DD
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY -> YYYY-MM-DD
        dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    
    const scheduleValue = `${dateStr}T${normalizedTime}`;
    
    // Create Date object in local timezone
    const localDate = new Date(scheduleValue);
    
    // Validate date
    if (isNaN(localDate.getTime())) {
      throw new Error(`Ngày không hợp lệ: ${day.date} ${slot.time}`);
    }

    try {
      // Create scheduled post in database
      const requestBody = {
        title: slot.angle || slot.captionIdea?.substring(0, 100) || 'AI Generated Post',
        content: slot.captionIdea || '',
        providers: mapProvidersToAPI([normalizedPlatform]),
        scheduled_at: localDate.toISOString(),
        media_urls: [],
        media_type: 'none',
        metadata: {
          type: 'social',
          platform: providerExists(normalizedPlatform) 
            ? PROVIDERS[normalizedPlatform].label 
            : normalizedPlatform,
          ratio: '1:1',
          hashtags: slot.recommendedHashtags?.join(' ') || '',
          ai_generated: true,
          ai_angle: slot.angle,
        }
      };

      console.log('📅 [AI PLAN] Creating scheduled post:', {
        ...requestBody,
        debug: {
          originalDate: day.date,
          parsedDate: dateStr,
          time: slot.time,
          scheduleValue,
          localDate: localDate.toLocaleString('vi-VN'),
          isoString: localDate.toISOString()
        }
      });

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tạo lịch đăng');
      }

      const result = await response.json();
      console.log('✅ [AI PLAN] Scheduled post created:', result);

      // Update UI state to reflect the applied slot
      const updatedChannelSet = new Set(selectedChannels);
      if (providerExists(normalizedPlatform)) {
        updatedChannelSet.add(normalizedPlatform);
      }

      setScheduleAt(scheduleValue);
      setSelectedChannels(updatedChannelSet);

      const updates: Partial<ComposeData> = {
        scheduleAt: scheduleValue,
        channels: Array.from(updatedChannelSet),
        content: slot.captionIdea,
        title: slot.angle,
      };

      if (slot.recommendedHashtags && slot.recommendedHashtags.length > 0) {
        const platformLabel = providerExists(normalizedPlatform)
          ? PROVIDERS[normalizedPlatform].label
          : composeData.metadata?.platform || 'Facebook Page';

        updates.metadata = {
          ...(composeData.metadata || { platform: platformLabel, ratio: '1:1' }),
          platform: platformLabel,
          hashtags: slot.recommendedHashtags.join(' '),
        };
      }

      onDataChange(updates);
      
      return result;
    } catch (error) {
      console.error('❌ [AI PLAN] Failed to create scheduled post:', error);
      throw error;
    }
  };

  const applyAllSlots = async (plan: AIContentPlanResponse) => {
    const allSlots: Array<{ day: AIContentPlanDay; slot: AIContentPlanSlot }> = [];
    
    for (const day of plan.plan) {
      for (const slot of day.slots) {
        allSlots.push({ day, slot });
      }
    }

    console.log(`📅 [AI PLAN] Creating ${allSlots.length} scheduled posts...`);

    const results = [];
    const errors = [];

    for (const { day, slot } of allSlots) {
      try {
        const result = await applyPlanSlot(day, slot);
        results.push(result);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error('❌ [AI PLAN] Failed to create slot:', { day, slot, error });
        errors.push({
          day: day.date,
          slot: `${slot.platform} ${slot.time}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ [AI PLAN] Created ${results.length}/${allSlots.length} scheduled posts`);
    
    if (errors.length > 0) {
      console.error('❌ [AI PLAN] Errors:', errors);
      throw new Error(`Đã tạo ${results.length}/${allSlots.length} lịch đăng. ${errors.length} lỗi.`);
    }

    return results;
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
    onDataChange({
      scheduleAt: formatted
    });
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
                {key === 'facebook' ? '📘' : key === 'instagram' ? '📷' : '💬'}
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
            onChange={(e) => {
              setScheduleAt(e.target.value);
              onDataChange({
                scheduleAt: e.target.value
              });
            }}
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
            onClick={() => {
              setScheduleAt('');
              onDataChange({ scheduleAt: '' });
            }}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
          >
            🚀 Đăng ngay lập tức
          </button>
        </div>
      </div>

      <ContentPlanAssistant
        composeData={composeData}
        onApplySlot={applyPlanSlot}
        onApplyAll={applyAllSlots}
        showToast={showToast}
      />

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

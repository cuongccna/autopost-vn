'use client';

import React, { useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import type { AIContentPlanDay, AIContentPlanResponse, AIContentPlanSlot } from '@/types/ai';
import { activityLogger } from '@/lib/services/activityLogger';

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

interface PlannerFormState {
  campaignName: string;
  startDate: string;
  endDate: string;
  cadencePerWeek: number;
  preferredTimes: string[];
  goals: string;
  instructions: string;
  timezone: string;
  selectedPlatforms: string[];
}

const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

function toDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().split('T')[0];
}

const initialEndDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return toDateInputValue(date);
};

export default function AIPlannerPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [plan, setPlan] = useState<AIContentPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [applyingAll, setApplyingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Media upload state for each slot
  const [slotMedia, setSlotMedia] = useState<Record<string, MediaFile[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(null);

  const defaultStart = useMemo(() => toDateInputValue(new Date()), []);
  const defaultEnd = useMemo(() => initialEndDate(), []);

  const [formState, setFormState] = useState<PlannerFormState>({
    campaignName: '',
    startDate: defaultStart,
    endDate: defaultEnd,
    cadencePerWeek: 3,
    preferredTimes: ['09:00', '14:00', '20:00'],
    goals: '',
    instructions: '',
    timezone: DEFAULT_TIMEZONE,
    selectedPlatforms: ['facebook', 'instagram', 'zalo'],
  });

  const handleFormChange = <K extends keyof PlannerFormState>(key: K, value: PlannerFormState[K]) => {
    setFormState(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePreferredTimeChange = (index: number, value: string) => {
    const next = [...formState.preferredTimes];
    next[index] = value;
    handleFormChange('preferredTimes', next);
  };

  const addPreferredTime = () => {
    handleFormChange('preferredTimes', [...formState.preferredTimes, '']);
  };

  const removePreferredTime = (index: number) => {
    const next = formState.preferredTimes.filter((_, idx) => idx !== index);
    handleFormChange('preferredTimes', next);
  };

  const togglePlatform = (platform: string) => {
    const set = new Set(formState.selectedPlatforms);
    if (set.has(platform)) {
      set.delete(platform);
    } else {
      set.add(platform);
    }
    handleFormChange('selectedPlatforms', Array.from(set));
  };

  // Media upload handlers
  const getSlotKey = (day: AIContentPlanDay, slot: AIContentPlanSlot, index: number) => 
    `${day.date}-${slot.platform}-${slot.time}-${index}`;

  const handleAddMedia = (slotKey: string) => {
    setActiveSlotKey(slotKey);
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeSlotKey || !e.target.files) return;
    
    const files = Array.from(e.target.files);
    const newMedia: MediaFile[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }));

    setSlotMedia(prev => ({
      ...prev,
      [activeSlotKey]: [...(prev[activeSlotKey] || []), ...newMedia],
    }));
    
    e.target.value = '';
    setActiveSlotKey(null);
  };

  const handleRemoveMedia = (slotKey: string, index: number) => {
    setSlotMedia(prev => {
      const current = prev[slotKey] || [];
      const removed = current[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return {
        ...prev,
        [slotKey]: current.filter((_, i) => i !== index),
      };
    });
  };

  const handleGeneratePlan = async () => {
    if (loading) return;
    if (formState.selectedPlatforms.length === 0) {
      showToast({ type: 'warning', message: 'Vui lòng chọn ít nhất một nền tảng.', title: 'AI Trợ lý' });
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/content-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: formState.campaignName,
          startDate: formState.startDate,
          endDate: formState.endDate,
          timezone: formState.timezone,
          cadencePerWeek: formState.cadencePerWeek,
          preferredPlatforms: formState.selectedPlatforms,
          preferredTimes: formState.preferredTimes.filter(Boolean),
          goals: formState.goals
            .split(',')
            .map(goal => goal.trim())
            .filter(Boolean),
          manualContext: formState.instructions,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Không thể tạo kế hoạch lúc này.');
      }

      const planData = (await response.json()) as AIContentPlanResponse;
      setPlan(planData);
      showToast({
        type: 'success',
        message: 'Đã tạo kế hoạch nội dung với AI.',
        title: 'AI Trợ lý',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
      setError(message);
      showToast({
        type: 'error',
        message,
        title: 'AI Trợ lý',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (day: AIContentPlanDay, slot: AIContentPlanSlot, slotIndex: number) => {
    try {
      const slotKey = getSlotKey(day, slot, slotIndex);
      const mediaFiles = slotMedia[slotKey]?.map(m => m.file) || [];
      const mediaUrls: string[] = [];

      // Upload media first if any
      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadRes = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData
          });
          
          if (!uploadRes.ok) throw new Error('Failed to upload media');
          
          const uploadData = await uploadRes.json();
          mediaUrls.push(uploadData.url);
        }
      }
      
      // Create scheduled post
      const postData = {
        content: slot.captionIdea || '',
        scheduled_at: `${day.date}T${slot.time}:00`,
        providers: [slot.platform],
        media_urls: mediaUrls,
        metadata: {
          type: 'social',
          platform: slot.platform,
          ai_generated: true,
          ai_angle: slot.angle,
          hashtags: slot.recommendedHashtags?.join(' ')
        }
      };

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule post');
      }
      
      const result = await response.json();
      
      // Log activity
      await activityLogger.logPostScheduled(postData, postData.scheduled_at, result.id);

      // Clear media for this slot after successful apply
      if (slotMedia[slotKey]) {
        slotMedia[slotKey].forEach(m => URL.revokeObjectURL(m.preview));
        setSlotMedia(prev => {
          const next = { ...prev };
          delete next[slotKey];
          return next;
        });
      }
      
      showToast({
        type: 'success',
        message: `Đã tạo lịch đăng ${slot.platform.toUpperCase()} vào ${new Date(`${day.date}T${slot.time}`).toLocaleString('vi-VN')}.`,
        title: '✅ Áp dụng thành công',
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể tạo lịch đăng',
        title: '❌ Lỗi',
      });
    }
  };

  const handleApplyAll = async () => {
    if (!plan) return;
    
    setApplyingAll(true);
    try {
      let successCount = 0;
      
      for (const day of plan.plan) {
        for (let i = 0; i < day.slots.length; i++) {
          const slot = day.slots[i];
          await handleApply(day, slot, i);
          successCount++;
        }
      }
      
      showToast({
        type: 'success',
        message: `Đã tạo ${successCount} lịch đăng thành công.`,
        title: '✅ Áp dụng tất cả thành công',
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể áp dụng tất cả lịch đăng',
        title: '❌ Lỗi',
      });
    } finally {
      setApplyingAll(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Trợ Lý Lịch Đăng</h1>
        <p className="mt-2 text-gray-600">Lập kế hoạch nội dung tự động cho Facebook, Instagram và Zalo OA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cấu hình chiến dịch</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chiến dịch</label>
                <input
                  type="text"
                  value={formState.campaignName}
                  onChange={e => handleFormChange('campaignName', e.target.value)}
                  placeholder="VD: Tết 2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={formState.startDate}
                    onChange={e => handleFormChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={formState.endDate}
                    min={formState.startDate}
                    onChange={e => handleFormChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nền tảng</label>
                <div className="flex flex-wrap gap-2">
                  {['facebook', 'instagram', 'zalo'].map(platform => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                        formState.selectedPlatforms.includes(platform)
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {platform === 'facebook' ? 'Facebook' : platform === 'instagram' ? 'Instagram' : 'Zalo OA'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số bài/tuần</label>
                <select
                  value={formState.cadencePerWeek}
                  onChange={e => handleFormChange('cadencePerWeek', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 10, 14].map(n => (
                    <option key={n} value={n}>{n} bài</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mục tiêu & Ghi chú</label>
                <textarea
                  rows={4}
                  value={formState.instructions}
                  onChange={e => handleFormChange('instructions', e.target.value)}
                  placeholder="Mô tả mục tiêu chiến dịch, đối tượng khách hàng, tone of voice..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={loading || formState.selectedPlatforms.length === 0}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang phân tích & tạo kế hoạch...
                  </span>
                ) : (
                  '🚀 Tạo Kế Hoạch AI'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {!plan && !loading && !error && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sẵn sàng lập kế hoạch</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Điền thông tin chiến dịch bên trái và để AI giúp bạn tạo lịch đăng bài chi tiết cho toàn bộ tuần.
              </p>
            </div>
          )}

          {plan && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div>
                  <h3 className="font-bold text-gray-900">Kết quả kế hoạch</h3>
                  <p className="text-sm text-gray-500">
                    {plan.plan.length} ngày • {plan.plan.reduce((acc, day) => acc + day.slots.length, 0)} bài đăng
                  </p>
                </div>
                <button
                  onClick={handleApplyAll}
                  disabled={applyingAll}
                  className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm transition-all"
                >
                  {applyingAll ? '⏳ Đang xử lý...' : '✅ Lên lịch tất cả'}
                </button>
              </div>

              <div className="space-y-6">
                {plan.plan.map((day, dayIndex) => (
                  <div key={day.date} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">
                          {new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                        </span>
                        {day.theme && (
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                            {day.theme}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {day.slots.map((slot, slotIndex) => {
                        const slotKey = getSlotKey(day, slot, slotIndex);
                        const media = slotMedia[slotKey] || [];
                        
                        return (
                          <div key={slotKey} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col md:flex-row gap-6">
                              {/* Time & Platform */}
                              <div className="w-full md:w-48 flex-shrink-0 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                                    slot.platform === 'facebook' ? 'bg-blue-100 text-blue-700' :
                                    slot.platform === 'instagram' ? 'bg-pink-100 text-pink-700' :
                                    'bg-blue-50 text-blue-600' // Zalo
                                  }`}>
                                    {slot.platform}
                                  </span>
                                  <span className="text-sm font-medium text-gray-600">⏰ {slot.time}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Góc độ: <span className="font-medium text-gray-700">{slot.angle}</span>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 space-y-3">
                                <p className="text-gray-800 text-sm leading-relaxed">
                                  {slot.captionIdea}
                                </p>
                                {slot.recommendedHashtags && (
                                  <div className="flex flex-wrap gap-2">
                                    {slot.recommendedHashtags.map((tag, i) => (
                                      <span key={i} className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Media Area */}
                                <div className="pt-3 border-t border-gray-100">
                                  <div className="flex flex-wrap items-center gap-3">
                                    {media.map((m, mIdx) => (
                                      <div key={mIdx} className="relative group w-20 h-20">
                                        {m.type === 'image' ? (
                                          <img
                                            src={m.preview}
                                            alt=""
                                            className="w-full h-full object-cover rounded-lg border border-gray-200 shadow-sm"
                                          />
                                        ) : (
                                          <video
                                            src={m.preview}
                                            className="w-full h-full object-cover rounded-lg border border-gray-200 shadow-sm"
                                          />
                                        )}
                                        <button
                                          onClick={() => handleRemoveMedia(slotKey, mIdx)}
                                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-600"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                    
                                    <button
                                      onClick={() => handleAddMedia(slotKey)}
                                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all gap-1"
                                      title="Thêm ảnh/video"
                                    >
                                      <span className="text-xl">📷</span>
                                      <span className="text-[10px] font-medium">Thêm Media</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Action */}
                              <div className="flex-shrink-0 flex items-start">
                                <button
                                  onClick={() => handleApply(day, slot, slotIndex)}
                                  className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm flex items-center gap-2"
                                >
                                  <span>Lên lịch</span>
                                  {media.length > 0 && <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs">{media.length}</span>}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

'use client';

import React, { useMemo, useState, useRef } from 'react';
import { buildAIContextFromComposeData } from '@/lib/utils/build-ai-context';
import type { AIContentPlanDay, AIContentPlanResponse, AIContentPlanSlot } from '@/types/ai';

interface ComposeSnapshot {
  title?: string;
  content?: string;
  channels?: string[];
  scheduleAt?: string;
  aiContext?: string;
  mediaUrls?: string[];
  metadata?: {
    type?: 'social' | 'video';
    platform?: string;
    ratio?: string;
    hashtags?: string;
    cta?: string;
    brandColor?: string;
    template?: string;
    duration?: number;
  };
}

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

interface ToastOptions {
  message: string;
  type: 'success' | 'error' | 'warning';
  title?: string;
}

interface ContentPlanAssistantProps {
  composeData: ComposeSnapshot;
  onApplySlot: (day: AIContentPlanDay, slot: AIContentPlanSlot, mediaFiles?: File[]) => void | Promise<void>;
  showToast?: (options: ToastOptions) => void;
  onApplyAll?: (plan: AIContentPlanResponse) => Promise<any>;
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

export default function ContentPlanAssistant({ composeData, onApplySlot, showToast, onApplyAll }: ContentPlanAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickMode, setShowQuickMode] = useState(true); // Quick mode by default
  const [plan, setPlan] = useState<AIContentPlanResponse | null>(null);
  const [requestMeta, setRequestMeta] = useState<{ generatedAt: string; timeframe: string } | null>(null);
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
    campaignName: composeData.metadata?.template || '',
    startDate: defaultStart,
    endDate: defaultEnd,
    cadencePerWeek: 3,
    preferredTimes: composeData.scheduleAt ? [composeData.scheduleAt.split('T')[1]?.slice(0, 5) || ''] : ['09:00', '14:00', '20:00'],
    goals: '',
    instructions: composeData.aiContext || '',
    timezone: DEFAULT_TIMEZONE,
    selectedPlatforms: composeData.channels && composeData.channels.length > 0 ? composeData.channels : ['facebook', 'instagram'],
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
      const message = 'Vui lòng chọn ít nhất một nền tảng để lập kế hoạch.';
      setError(message);
      showToast?.({ type: 'warning', message, title: 'AI Trợ lý' });
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
          aiContext: buildAIContextFromComposeData(composeData),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Không thể tạo kế hoạch lúc này.');
      }

      const planData = (await response.json()) as AIContentPlanResponse;
      setPlan(planData);
      setRequestMeta({
        generatedAt: new Date().toISOString(),
        timeframe: `${formState.startDate} → ${formState.endDate}`,
      });
      showToast?.({
        type: 'success',
        message: 'Đã tạo kế hoạch nội dung với AI.',
        title: 'AI Trợ lý',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
      setError(message);
      showToast?.({
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
      
      // Call parent's onApplySlot which should create the scheduled post
      await onApplySlot(day, slot, mediaFiles);
      
      // Clear media for this slot after successful apply
      if (slotMedia[slotKey]) {
        slotMedia[slotKey].forEach(m => URL.revokeObjectURL(m.preview));
        setSlotMedia(prev => {
          const next = { ...prev };
          delete next[slotKey];
          return next;
        });
      }
      
      showToast?.({
        type: 'success',
        message: `Đã tạo lịch đăng ${slot.platform.toUpperCase()} vào ${new Date(`${day.date}T${slot.time}`).toLocaleString('vi-VN')}${mediaFiles.length > 0 ? ` với ${mediaFiles.length} media` : ''}.`,
        title: '✅ Áp dụng thành công',
      });
    } catch (error) {
      showToast?.({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể tạo lịch đăng',
        title: '❌ Lỗi',
      });
    }
  };

  const handleApplyAll = async () => {
    if (!plan || !onApplyAll) return;
    
    setApplyingAll(true);
    try {
      await onApplyAll(plan);
      
      const totalSlots = plan.plan.reduce((acc, day) => acc + day.slots.length, 0);
      showToast?.({
        type: 'success',
        message: `Đã tạo ${totalSlots} lịch đăng từ ${plan.plan[0]?.date} đến ${plan.plan[plan.plan.length - 1]?.date}.`,
        title: '✅ Áp dụng tất cả thành công',
      });
      setIsOpen(false);
    } catch (error) {
      showToast?.({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể áp dụng tất cả lịch đăng',
        title: '❌ Lỗi',
      });
    } finally {
      setApplyingAll(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl shadow-lg border-2 border-indigo-200 overflow-hidden">
      {/* Hidden file input for media upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h3 className="text-white font-bold">AI Trợ lý lịch đăng</h3>
              <p className="text-indigo-100 text-xs">Tạo kế hoạch đăng bài thông minh</p>
            </div>
          </div>
          {!isOpen ? (
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-white text-indigo-600 text-sm font-semibold rounded-lg hover:bg-indigo-50 transition-all shadow-md"
            >
              ✨ Bắt đầu
            </button>
          ) : (
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 bg-white/20 text-white text-sm rounded-lg hover:bg-white/30 transition-all"
            >
              Thu gọn
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats when collapsed */}
      {plan && !isOpen && (
        <div className="px-4 py-3 bg-white/80 border-t border-indigo-100">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs">📅</span>
              <span className="text-gray-700">{plan.plan.length} ngày</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs">📝</span>
              <span className="text-gray-700">{plan.plan.reduce((acc, day) => acc + day.slots.length, 0)} bài</span>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="ml-auto text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Xem chi tiết →
            </button>
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-4 bg-white/90 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Quick Mode Toggle */}
          <div className="flex items-center gap-2 pb-3 border-b">
            <button
              onClick={() => setShowQuickMode(true)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                showQuickMode 
                  ? 'bg-indigo-600 text-white font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ⚡ Nhanh
            </button>
            <button
              onClick={() => setShowQuickMode(false)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                !showQuickMode 
                  ? 'bg-indigo-600 text-white font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ⚙️ Nâng cao
            </button>
          </div>

          {/* Quick Mode Form */}
          {showQuickMode ? (
            <div className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={formState.startDate}
                    onChange={e => handleFormChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={formState.endDate}
                    min={formState.startDate}
                    onChange={e => handleFormChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Frequency & Platforms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Số bài/tuần</label>
                  <select
                    value={formState.cadencePerWeek}
                    onChange={e => handleFormChange('cadencePerWeek', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(n => (
                      <option key={n} value={n}>{n} bài</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nền tảng</label>
                  <div className="flex gap-1">
                    {['facebook', 'instagram'].map(platform => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => togglePlatform(platform)}
                        className={`flex-1 px-2 py-2 text-xs rounded-lg border transition-all ${
                          formState.selectedPlatforms.includes(platform)
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {platform === 'facebook' ? '📘 FB' : '📸 IG'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Instructions */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả nội dung (tùy chọn)</label>
                <textarea
                  rows={2}
                  value={formState.instructions}
                  onChange={e => handleFormChange('instructions', e.target.value)}
                  placeholder="VD: Quảng bá sản phẩm mới, chia sẻ tips marketing..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGeneratePlan}
                disabled={loading || formState.selectedPlatforms.length === 0}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang tạo...
                  </>
                ) : (
                  <>🚀 Tạo kế hoạch AI</>
                )}
              </button>
            </div>
          ) : (
            /* Advanced Mode - Original detailed form */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tên chiến dịch</label>
                  <input
                    type="text"
                    value={formState.campaignName}
                    onChange={e => handleFormChange('campaignName', e.target.value)}
                    placeholder="VD: Tết 2026"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mục tiêu</label>
                  <input
                    type="text"
                    value={formState.goals}
                    onChange={e => handleFormChange('goals', e.target.value)}
                    placeholder="VD: tăng tương tác"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={formState.startDate}
                    onChange={e => handleFormChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={formState.endDate}
                    min={formState.startDate}
                    onChange={e => handleFormChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Số bài/tuần</label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={formState.cadencePerWeek}
                  onChange={e => handleFormChange('cadencePerWeek', Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nền tảng</label>
                <div className="flex flex-wrap gap-2">
                  {['facebook', 'instagram', 'zalo'].map(platform => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        formState.selectedPlatforms.includes(platform)
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {platform.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Khung giờ ưu tiên</label>
                <div className="space-y-2">
                  {formState.preferredTimes.map((time, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="time"
                        value={time}
                        onChange={e => handlePreferredTimeChange(idx, e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
                      />
                      <button
                        onClick={() => removePreferredTime(idx)}
                        className="px-3 py-2 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addPreferredTime}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    + Thêm khung giờ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  value={formState.instructions}
                  onChange={e => handleFormChange('instructions', e.target.value)}
                  placeholder="Mô tả thêm về nội dung..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none"
                />
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={loading || formState.selectedPlatforms.length === 0}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Đang tạo...' : '🚀 Tạo kế hoạch AI'}
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Plan Results */}
          {plan && (
            <div className="space-y-4 pt-4 border-t">
              {/* Apply All Button */}
              {onApplyAll && plan.plan.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">🎯 Áp dụng toàn bộ</h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {plan.plan.reduce((acc, day) => acc + day.slots.length, 0)} lịch đăng
                      </p>
                    </div>
                    <button
                      onClick={handleApplyAll}
                      disabled={applyingAll}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {applyingAll ? '⏳ Đang...' : '✅ Áp dụng tất cả'}
                    </button>
                  </div>
                </div>
              )}

              {/* Individual Slots */}
              {plan.plan.map(day => (
                <div key={day.date} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <div className="font-medium text-gray-900 text-sm">
                      📅 {new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                    </div>
                    {day.theme && <div className="text-xs text-gray-600">{day.theme}</div>}
                  </div>

                  <div className="divide-y">
                    {day.slots.map((slot, index) => {
                      const slotKey = getSlotKey(day, slot, index);
                      const media = slotMedia[slotKey] || [];
                      
                      return (
                        <div key={slotKey} className="p-3 space-y-2 hover:bg-gray-50">
                          {/* Slot Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  slot.platform === 'facebook' ? 'bg-blue-100 text-blue-700' :
                                  slot.platform === 'instagram' ? 'bg-pink-100 text-pink-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {slot.platform.toUpperCase()}
                                </span>
                                <span className="text-gray-500">⏰ {slot.time}</span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                                <strong>{slot.angle}</strong>
                              </p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {slot.captionIdea}
                              </p>
                            </div>
                          </div>

                          {/* Media Upload Section */}
                          <div className="flex items-center gap-2 pt-2">
                            {/* Media Thumbnails */}
                            {media.map((m, mIdx) => (
                              <div key={mIdx} className="relative group">
                                {m.type === 'image' ? (
                                  <img
                                    src={m.preview}
                                    alt=""
                                    className="w-12 h-12 object-cover rounded-lg border"
                                  />
                                ) : (
                                  <video
                                    src={m.preview}
                                    className="w-12 h-12 object-cover rounded-lg border"
                                  />
                                )}
                                <button
                                  onClick={() => handleRemoveMedia(slotKey, mIdx)}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            
                            {/* Add Media Button */}
                            <button
                              onClick={() => handleAddMedia(slotKey)}
                              className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                              title="Thêm ảnh/video"
                            >
                              <span className="text-lg">📎</span>
                            </button>

                            {/* Apply Button */}
                            <button
                              onClick={() => handleApply(day, slot, index)}
                              className="ml-auto px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                            >
                              ✓ Áp dụng
                              {media.length > 0 && <span className="text-indigo-200">({media.length})</span>}
                            </button>
                          </div>

                          {/* Hashtags */}
                          {slot.recommendedHashtags && slot.recommendedHashtags.length > 0 && (
                            <div className="text-xs text-gray-400 truncate">
                              {slot.recommendedHashtags.slice(0, 3).join(' ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

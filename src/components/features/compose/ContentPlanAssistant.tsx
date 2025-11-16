'use client';

import { useMemo, useState } from 'react';
import { buildAIContextFromComposeData } from '@/lib/utils/build-ai-context';
import type { AIContentPlanDay, AIContentPlanResponse, AIContentPlanSlot } from '@/types/ai';

interface ComposeSnapshot {
  title?: string;
  content?: string;
  channels?: string[];
  scheduleAt?: string;
  aiContext?: string;
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

interface ToastOptions {
  message: string;
  type: 'success' | 'error' | 'warning';
  title?: string;
}

interface ContentPlanAssistantProps {
  composeData: ComposeSnapshot;
  onApplySlot: (day: AIContentPlanDay, slot: AIContentPlanSlot) => void | Promise<void>;
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
  const [plan, setPlan] = useState<AIContentPlanResponse | null>(null);
  const [requestMeta, setRequestMeta] = useState<{ generatedAt: string; timeframe: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [applyingAll, setApplyingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultStart = useMemo(() => toDateInputValue(new Date()), []);
  const defaultEnd = useMemo(() => initialEndDate(), []);

  const [formState, setFormState] = useState<PlannerFormState>({
    campaignName: composeData.metadata?.template || '',
    startDate: defaultStart,
    endDate: defaultEnd,
    cadencePerWeek: 3,
    preferredTimes: composeData.scheduleAt ? [composeData.scheduleAt.split('T')[1]?.slice(0, 5) || ''] : [],
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

  const handleApply = async (day: AIContentPlanDay, slot: AIContentPlanSlot) => {
    try {
      // Call parent's onApplySlot which should create the scheduled post
      await onApplySlot(day, slot);
      
      showToast?.({
        type: 'success',
        message: `Đã tạo lịch đăng ${slot.platform.toUpperCase()} vào ${new Date(`${day.date}T${slot.time}`).toLocaleString('vi-VN')}.`,
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
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Trợ lý lịch đăng</h3>
          <p className="text-sm text-gray-600 mt-1">
            Lên kế hoạch đăng bài trong tuần, tránh trùng lặp nội dung và tối ưu khung giờ.
          </p>
          {plan && requestMeta && (
            <div className="mt-3 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
              <div><strong>Khung thời gian:</strong> {requestMeta.timeframe}</div>
              <div><strong>Số ngày:</strong> {plan.plan.length}</div>
              <div><strong>Số gợi ý:</strong> {plan.plan.reduce((acc, day) => acc + day.slots.length, 0)}</div>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Mở trợ lý
        </button>
      </div>

      {plan && !isOpen && (
        <div className="space-y-3 text-sm text-gray-700">
          <div className="font-medium text-gray-900">Gợi ý mới nhất</div>
          <div className="text-sm text-gray-600">
            {plan.summary || 'AI đã chuẩn bị kế hoạch đăng bài phù hợp thị trường Việt Nam.'}
          </div>
          <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
            {plan.recommendations.slice(0, 3).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Lập kế hoạch AI</h4>
                <p className="text-sm text-gray-600">
                  Chọn khung thời gian, tần suất mong muốn và để AI đề xuất lịch đăng phù hợp.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên chiến dịch</label>
                  <input
                    type="text"
                    value={formState.campaignName}
                    onChange={event => handleFormChange('campaignName', event.target.value)}
                    placeholder="VD: Tết 2026 - Khuyến mãi"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Cadence (bài/tuần)</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={formState.cadencePerWeek}
                    onChange={event => handleFormChange('cadencePerWeek', Number(event.target.value) || 1)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={formState.startDate}
                    onChange={event => handleFormChange('startDate', event.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày kết thúc</label>
                  <input
                    type="date"
                    min={formState.startDate}
                    value={formState.endDate}
                    onChange={event => handleFormChange('endDate', event.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Mục tiêu chiến dịch</label>
                  <input
                    type="text"
                    value={formState.goals}
                    onChange={event => handleFormChange('goals', event.target.value)}
                    placeholder="VD: nhận diện thương hiệu, tăng tương tác"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Múi giờ</label>
                  <input
                    type="text"
                    value={formState.timezone}
                    onChange={event => handleFormChange('timezone', event.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </section>

              <section className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Khung giờ ưu tiên</label>
                <div className="space-y-2">
                  {formState.preferredTimes.map((value, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="time"
                        value={value}
                        onChange={event => handlePreferredTimeChange(index, event.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => removePreferredTime(index)}
                        type="button"
                        className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                      >
                        Gỡ
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPreferredTime}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Thêm khung giờ
                  </button>
                </div>
              </section>

              <section className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Chọn nền tảng</label>
                <div className="flex flex-wrap gap-2">
                  {['facebook', 'instagram', 'zalo', 'tiktok'].map(platform => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        formState.selectedPlatforms.includes(platform)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {platform.toUpperCase()}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <label className="block text-sm font-medium text-gray-700">Ghi chú / bối cảnh thêm</label>
                <textarea
                  rows={4}
                  value={formState.instructions}
                  onChange={event => handleFormChange('instructions', event.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ví dụ: Ưu tiên chủ đề Tết, tránh giảm giá quá sâu trong tuần đầu, nhắc tới chương trình khách hàng thân thiết..."
                />
              </section>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGeneratePlan}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
                >
                  {loading ? 'Đang tạo...' : 'Tạo kế hoạch AI'}
                </button>
                {plan && (
                  <span className="text-xs text-gray-500">
                    Đã tạo {requestMeta?.generatedAt && new Date(requestMeta.generatedAt).toLocaleString('vi-VN')}
                  </span>
                )}
              </div>

              {plan && (
                <section className="space-y-4">
                  {/* Apply All Button */}
                  {onApplyAll && plan.plan.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">Áp dụng toàn bộ kế hoạch</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Tạo {plan.plan.reduce((acc, day) => acc + day.slots.length, 0)} lịch đăng tự động từ {new Date(plan.plan[0].date).toLocaleDateString('vi-VN')} đến {new Date(plan.plan[plan.plan.length - 1].date).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <button
                          onClick={handleApplyAll}
                          disabled={applyingAll}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {applyingAll ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Đang áp dụng...
                            </>
                          ) : (
                            <>🚀 Áp dụng tất cả</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {plan.plan.map(day => (
                    <div key={day.date} className="border border-gray-200 rounded-xl p-4 space-y-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          📅 {new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                        </div>
                        <div className="text-sm text-gray-600">{day.theme}</div>
                        {day.focus && <div className="text-xs text-gray-500 mt-1">Trọng tâm: {day.focus}</div>}
                      </div>

                      <div className="space-y-2">
                        {day.slots.map((slot, index) => (
                          <div key={`${slot.platform}-${slot.time}-${index}`} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold text-gray-800">
                                {slot.platform.toUpperCase()} · {slot.time}
                              </div>
                              <button
                                onClick={() => handleApply(day, slot)}
                                className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                              >
                                Áp dụng
                              </button>
                            </div>
                            <div className="text-sm text-gray-700 whitespace-pre-line">
                              <strong>{slot.angle}</strong>
                              <br />
                              {slot.captionIdea}
                            </div>
                            {slot.recommendedHashtags && slot.recommendedHashtags.length > 0 && (
                              <div className="text-xs text-gray-500">
                                Hashtags: {slot.recommendedHashtags.join(' ')}
                              </div>
                            )}
                            {slot.assets && slot.assets.length > 0 && (
                              <div className="text-xs text-gray-500">
                                Gợi ý media: {slot.assets.join(', ')}
                              </div>
                            )}
                            {slot.duplicateOf && slot.duplicateOf.length > 0 && (
                              <div className="text-xs text-orange-600">
                                ⚠️ Có thể trùng với: {slot.duplicateOf.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {plan.duplicateWarnings && plan.duplicateWarnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 space-y-1">
                      <div className="font-medium">Cảnh báo trùng lặp</div>
                      {plan.duplicateWarnings.map((warning, index) => (
                        <div key={index}>• {warning}</div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

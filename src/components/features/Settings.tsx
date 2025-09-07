'use client';

import { useState, useEffect } from 'react';
import SchedulerMonitor from './SchedulerMonitor';

interface SettingsData {
  notifySuccess: boolean;
  notifyFail: boolean;
  notifyToken: boolean;
  timezone: string;
  golden: string[];
  rateLimit: number;
}

interface SettingsProps {
  settings: SettingsData;
  onSaveSettings: (_settings: SettingsData) => void;
  onResetSettings: () => void;
}

const timezones = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (GMT+7)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (GMT+7)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
];

export default function Settings({ settings, onSaveSettings, onResetSettings }: SettingsProps) {
  const [formData, setFormData] = useState<SettingsData>(settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveSettings(formData);
    setIsSaving(false);
  };

  const handleReset = () => {
    onResetSettings();
  };

  const updateGoldenHour = (index: number, value: string) => {
    const newGolden = [...formData.golden];
    newGolden[index] = value || '09:00';
    setFormData({ ...formData, golden: newGolden });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-base font-semibold">Cài đặt Workspace</div>
          <span className="text-xs text-gray-500">Tác động đến lập lịch & thông báo</span>
        </div>
        
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Notifications */}
          <div className="space-y-3">
            <div className="font-medium">Thông báo</div>
            
            <label className="flex items-center justify-between rounded-xl border p-3">
              <span>Thông báo khi đăng thành công</span>
              <input 
                type="checkbox" 
                className="h-4 w-4"
                checked={formData.notifySuccess}
                onChange={(e) => setFormData({ ...formData, notifySuccess: e.target.checked })}
              />
            </label>
            
            <label className="flex items-center justify-between rounded-xl border p-3">
              <span>Thông báo khi đăng thất bại</span>
              <input 
                type="checkbox" 
                className="h-4 w-4"
                checked={formData.notifyFail}
                onChange={(e) => setFormData({ ...formData, notifyFail: e.target.checked })}
              />
            </label>
            
            <label className="flex items-center justify-between rounded-xl border p-3">
              <span>Nhắc hạn token sắp hết</span>
              <input 
                type="checkbox" 
                className="h-4 w-4"
                checked={formData.notifyToken}
                onChange={(e) => setFormData({ ...formData, notifyToken: e.target.checked })}
              />
            </label>
          </div>
          
          {/* Timezone & Golden Hours */}
          <div className="space-y-3">
            <div className="font-medium">Múi giờ & Giờ vàng mặc định</div>
            
            <div>
              <label className="block text-sm mb-1">Múi giờ</label>
              <select 
                className="w-full rounded-xl border p-2"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              >
                {timezones.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Giờ vàng (3 khung giờ tối ưu)</label>
              <div className="grid grid-cols-3 gap-2">
                <input 
                  type="time" 
                  className="rounded-xl border p-2"
                  value={formData.golden[0] || '09:00'}
                  onChange={(e) => updateGoldenHour(0, e.target.value)}
                />
                <input 
                  type="time" 
                  className="rounded-xl border p-2"
                  value={formData.golden[1] || '12:30'}
                  onChange={(e) => updateGoldenHour(1, e.target.value)}
                />
                <input 
                  type="time" 
                  className="rounded-xl border p-2"
                  value={formData.golden[2] || '20:00'}
                  onChange={(e) => updateGoldenHour(2, e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Hệ thống sẽ gợi ý những khung giờ này khi lên lịch bài đăng
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Safety Limits */}
          <div className="space-y-3">
            <div className="font-medium">Giới hạn an toàn</div>
            
            <div>
              <label className="block text-sm mb-1">Số bài tối đa/giờ</label>
              <input 
                type="number" 
                min="1" 
                max="100"
                className="w-40 rounded-xl border p-2"
                value={formData.rateLimit}
                onChange={(e) => setFormData({ ...formData, rateLimit: Math.max(1, parseInt(e.target.value) || 1) })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Để tránh bị đánh dấu spam trên nền tảng.
              </p>
            </div>
          </div>
          
          {/* Additional Settings */}
          <div className="space-y-3">
            <div className="font-medium">Khác</div>
            
            <div className="rounded-xl border p-3 bg-gray-50">
              <div className="text-sm font-medium mb-2">Tự động xóa bài cũ</div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" />
                Xóa bài đã đăng sau 30 ngày
              </label>
            </div>
            
            <div className="rounded-xl border p-3 bg-gray-50">
              <div className="text-sm font-medium mb-2">Chế độ thử nghiệm</div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" />
                Cho phép đăng thử nghiệm (không thực sự đăng)
              </label>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <button 
            type="button" 
            onClick={handleReset}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Khôi phục mặc định
          </button>
          <button 
            type="button" 
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </form>
    </section>

    {/* Scheduler Monitor */}
    <SchedulerMonitor />
    </div>
  );
}

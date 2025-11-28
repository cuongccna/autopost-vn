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
  autoDelete: boolean;
  autoDeleteDays: number;
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
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load settings from API on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const workspaceId = localStorage.getItem('current_workspace_id');
      const url = workspaceId 
        ? `/api/workspace/settings?workspace_id=${workspaceId}`
        : '/api/workspace/settings';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      
      const data = await response.json();
      
      console.log('📥 Loaded settings from API:', data);
      
      // Convert API format to component format
      const loadedSettings: SettingsData = {
        notifySuccess: data.settings.notifications?.onSuccess ?? true,
        notifyFail: data.settings.notifications?.onFailure ?? true,
        notifyToken: data.settings.notifications?.onTokenExpiry ?? true,
        timezone: data.settings.scheduling?.timezone || 'Asia/Ho_Chi_Minh',
        golden: data.settings.scheduling?.goldenHours || ['09:00', '12:30', '20:00'],
        rateLimit: data.settings.scheduling?.rateLimit || 10,
        autoDelete: data.settings.advanced?.autoDeleteOldPosts ?? false,
        autoDeleteDays: data.settings.advanced?.autoDeleteDays || 30,
      };
      
      console.log('🔄 Converted settings:', loadedSettings);
      
      setFormData(loadedSettings);
      onSaveSettings(loadedSettings); // Update parent state
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use default settings on error
      setFormData(settings);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const workspaceId = localStorage.getItem('current_workspace_id');
      
      // Convert component format to API format
      const apiSettings = {
        notifications: {
          onSuccess: formData.notifySuccess,
          onFailure: formData.notifyFail,
          onTokenExpiry: formData.notifyToken,
        },
        scheduling: {
          timezone: formData.timezone,
          goldenHours: formData.golden,
          rateLimit: formData.rateLimit,
        },
        advanced: {
          autoDeleteOldPosts: formData.autoDelete,
          autoDeleteDays: formData.autoDeleteDays,
        },
      };
      
      const response = await fetch('/api/workspace/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          settings: apiSettings,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }
      
      const result = await response.json();
      console.log('✅ Settings saved successfully:', result);
      
      // Reload settings from server to confirm
      await loadSettings();
      
      // Also update parent state
      await onSaveSettings(formData);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
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
      {isLoading ? (
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Đang tải cài đặt...</span>
          </div>
        </div>
      ) : (
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-base font-semibold">Cài đặt Workspace</div>
            <span className="text-xs text-gray-500">Tác động đến lập lịch & thông báo</span>
          </div>
          
          {saveError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              ❌ {saveError}
            </div>
          )}
        
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
              <label className="flex items-center gap-2 text-sm mb-2">
                <input 
                  type="checkbox" 
                  className="h-4 w-4"
                  checked={formData.autoDelete}
                  onChange={(e) => setFormData({ ...formData, autoDelete: e.target.checked })}
                />
                Xóa bài đã đăng sau {formData.autoDeleteDays} ngày
              </label>
              {formData.autoDelete && (
                <input
                  type="number"
                  min="1"
                  max="365"
                  className="w-24 rounded-lg border p-2 text-sm"
                  value={formData.autoDeleteDays}
                  onChange={(e) => setFormData({ ...formData, autoDeleteDays: Math.max(1, parseInt(e.target.value) || 30) })}
                />
              )}
            </div>
            

          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <button 
            type="button" 
            onClick={handleReset}
            disabled={isSaving || isLoading}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Khôi phục mặc định
          </button>
          <button 
            type="button" 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </form>
    </section>
      )}

    {/* Scheduler Monitor */}
    <SchedulerMonitor />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/lib/utils/toast';

interface NotificationPreferences {
  notifySuccess: boolean;
  notifyFail: boolean;
  notifyToken: boolean;
}

export default function NotificationSettings() {
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notifySuccess: true,
    notifyFail: true,
    notifyToken: true,
  });

  // Load notification settings from workspace settings
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/workspace/settings');
      
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      console.log('📥 Loaded notification settings:', data);

      setPreferences({
        notifySuccess: data.settings?.notifications?.onSuccess ?? true,
        notifyFail: data.settings?.notifications?.onFailure ?? true,
        notifyToken: data.settings?.notifications?.onTokenExpiry ?? true,
      });
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast.error('Không thể tải cài đặt thông báo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };

    setPreferences(newPreferences);

    try {
      setLoading(true);

      // Map to workspace settings format
      const notificationSettings = {
        onSuccess: newPreferences.notifySuccess,
        onFailure: newPreferences.notifyFail,
        onTokenExpiry: newPreferences.notifyToken,
      };

      // Get current settings first
      const getResponse = await fetch('/api/workspace/settings');
      if (!getResponse.ok) {
        throw new Error('Failed to get current settings');
      }
      const currentData = await getResponse.json();

      // Update only notifications
      const updatedSettings = {
        ...currentData.settings,
        notifications: notificationSettings,
      };

      const response = await fetch('/api/workspace/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      console.log('✅ Saved notification settings');
      toast.success('Đã cập nhật cài đặt thông báo');

    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Không thể lưu cài đặt');
      
      // Revert on error
      setPreferences(preferences);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
        <Bell className="w-5 h-5" />
        <span>Cài đặt thông báo</span>
      </h2>

      <div className="space-y-6">
        {/* Success Notifications */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-medium">Thông báo khi đăng thành công</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Nhận email khi bài đăng được đăng thành công lên mạng xã hội
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={preferences.notifySuccess}
              onChange={() => handleToggle('notifySuccess')}
              disabled={loading}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Failure Notifications */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-medium">Thông báo khi đăng thất bại</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Nhận email khi có lỗi xảy ra trong quá trình đăng bài
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={preferences.notifyFail}
              onChange={() => handleToggle('notifyFail')}
              disabled={loading}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Token Expiry Notifications */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-medium">Nhắc hạn token sắp hết</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Nhận email khi token kết nối mạng xã hội sắp hết hạn (trước 7 ngày)
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={preferences.notifyToken}
              onChange={() => handleToggle('notifyToken')}
              disabled={loading}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Lưu ý:</strong> Thông báo sẽ được gửi đến email đã đăng ký của bạn. 
            Đảm bảo kiểm tra cả hộp thư spam nếu không thấy email.
          </p>
        </div>
      </div>
    </div>
  );
}

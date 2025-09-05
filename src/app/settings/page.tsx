'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserProfileSettings } from '@/components/shared/UserProfileSettings';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database,
  ArrowLeft
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const settingSections = [
    {
      id: 'profile',
      title: 'Hồ sơ cá nhân',
      description: 'Quản lý thông tin tài khoản và bảo mật',
      icon: User,
      component: UserProfileSettings
    },
    {
      id: 'notifications',
      title: 'Thông báo',
      description: 'Cấu hình thông báo và email',
      icon: Bell,
      component: null
    },
    {
      id: 'privacy',
      title: 'Quyền riêng tư',
      description: 'Cài đặt quyền riêng tư và bảo mật',
      icon: Shield,
      component: null
    },
    {
      id: 'appearance',
      title: 'Giao diện',
      description: 'Tùy chỉnh theme và màu sắc',
      icon: Palette,
      component: null
    },
    {
      id: 'data',
      title: 'Dữ liệu',
      description: 'Xuất dữ liệu và xóa tài khoản',
      icon: Database,
      component: null
    }
  ];

  const activeSettingSection = settingSections.find(section => section.id === activeSection);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Quay lại</span>
              </button>
              <div className="flex items-center space-x-3">
                <Settings className="w-6 h-6 text-gray-600" />
                <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {settingSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    } border`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{section.title}</div>
                        <div className="text-sm text-gray-500">{section.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {activeSection === 'profile' && activeSettingSection?.component && (
                <div className="p-6">
                  <UserProfileSettings />
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Cài đặt thông báo</span>
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Thông báo email</h3>
                        <p className="text-sm text-gray-500">Nhận thông báo qua email khi có bài đăng mới</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Thông báo push</h3>
                        <p className="text-sm text-gray-500">Nhận thông báo trên trình duyệt</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'privacy' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Quyền riêng tư & Bảo mật</span>
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="font-medium text-yellow-800">Xác thực hai yếu tố</h3>
                      <p className="text-sm text-yellow-700 mt-1">Tăng cường bảo mật tài khoản với xác thực hai yếu tố</p>
                      <button className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                        Kích hoạt 2FA
                      </button>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Phiên đăng nhập</h3>
                      <p className="text-sm text-gray-500 mb-3">Quản lý các thiết bị đã đăng nhập</p>
                      <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                        Đăng xuất tất cả thiết bị
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'appearance' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                    <Palette className="w-5 h-5" />
                    <span>Giao diện</span>
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">Theme</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {['Light', 'Dark', 'Auto'].map((theme) => (
                          <button
                            key={theme}
                            className={`p-4 border rounded-lg text-center transition-colors ${
                              theme === 'Light' 
                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'data' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>Dữ liệu & Tài khoản</span>
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium">Xuất dữ liệu</h3>
                      <p className="text-sm text-gray-500 mb-3">Tải xuống toàn bộ dữ liệu của bạn</p>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Xuất dữ liệu
                      </button>
                    </div>
                    
                    <div className="border-t pt-6">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h3 className="font-medium text-red-800">Xóa tài khoản</h3>
                        <p className="text-sm text-red-700 mt-1">Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu</p>
                        <button className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                          Xóa tài khoản
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

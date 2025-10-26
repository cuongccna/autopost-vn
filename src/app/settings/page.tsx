'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserProfileSettings } from '@/components/shared/UserProfileSettings';
import NotificationSettings from '@/components/features/NotificationSettings';
import PrivacySettings from '@/components/features/PrivacySettings';
import AppearanceSettings from '@/components/features/AppearanceSettings';
import DataSettings from '@/components/features/DataSettings';
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
                <NotificationSettings />
              )}

              {activeSection === 'privacy' && (
                <PrivacySettings />
              )}

              {activeSection === 'appearance' && (
                <AppearanceSettings />
              )}

              {activeSection === 'data' && (
                <DataSettings />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

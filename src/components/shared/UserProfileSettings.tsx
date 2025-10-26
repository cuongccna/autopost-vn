import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  User, 
  Settings, 
  Lock, 
  Crown, 
  Star, 
  Gem,
  Mail,
  Phone,
  Camera,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

interface UserProfileSettingsProps {
  onClose?: () => void;
}

export const UserProfileSettings: React.FC<UserProfileSettingsProps> = ({ onClose }) => {
  const { data: session, update } = useSession();
  const { userRole } = usePermissions();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form states
  const [profileData, setProfileData] = useState({
    fullName: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    avatar: session?.user?.image || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user profile data from database
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) return;

      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          console.log('📥 Loaded user profile from database:', data);
          
          setProfileData({
            fullName: data.user?.full_name || session?.user?.name || '',
            email: data.user?.email || session?.user?.email || '',
            phone: data.user?.phone || '',
            avatar: data.user?.avatar_url || session?.user?.image || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        // Keep default values from session
      }
    };

    loadProfile();
  }, [session]);

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            name: profileData.fullName,
            image: profileData.avatar
          }
        });
      } else {
        setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật thông tin' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật thông tin' });
    }
    setLoading(false);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra khi đổi mật khẩu' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi đổi mật khẩu' });
    }
    setLoading(false);
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'free':
        return {
          name: 'Gói Miễn Phí',
          icon: User,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300'
        };
      case 'professional':
        return {
          name: 'Gói Professional',
          icon: Crown,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-300'
        };
      case 'enterprise':
        return {
          name: 'Gói Enterprise',
          icon: Gem,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          borderColor: 'border-purple-300'
        };
      default:
        return {
          name: 'Gói Miễn Phí',
          icon: User,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300'
        };
    }
  };

  const roleInfo = getRoleInfo(userRole);
  const RoleIcon = roleInfo.icon;

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-full ${roleInfo.bgColor} ${roleInfo.borderColor} border-2 flex items-center justify-center`}>
              <RoleIcon className={`w-8 h-8 ${roleInfo.color}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{session?.user?.name || 'Người dùng'}</h2>
              <p className="text-blue-100">{session?.user?.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleInfo.bgColor} ${roleInfo.color}`}>
                  {roleInfo.name}
                </span>
                {userRole !== 'enterprise' && (
                  <Link href="/pricing" className="text-yellow-300 hover:text-yellow-200 text-xs underline">
                    Nâng cấp
                  </Link>
                )}
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'profile', label: 'Thông tin cá nhân', icon: User },
            { id: 'security', label: 'Bảo mật', icon: Lock },
            { id: 'subscription', label: 'Gói dịch vụ', icon: Star }
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        {message && (
          <div className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Thông tin cá nhân</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh đại diện
                </label>
                <div className="relative">
                  <Camera className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={profileData.avatar}
                    onChange={(e) => setProfileData(prev => ({ ...prev, avatar: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="URL ảnh đại diện"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleProfileUpdate}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Đổi mật khẩu</span>
            </h3>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Star className="w-5 h-5" />
              <span>Gói dịch vụ hiện tại</span>
            </h3>

            <div className={`p-6 rounded-lg border-2 ${roleInfo.borderColor} ${roleInfo.bgColor}`}>
              <div className="flex items-center space-x-4 mb-4">
                <RoleIcon className={`w-12 h-12 ${roleInfo.color}`} />
                <div>
                  <h4 className="text-xl font-bold">{roleInfo.name}</h4>
                  <p className="text-gray-600">Gói dịch vụ của bạn</p>
                </div>
              </div>

              {userRole === 'free' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Giới hạn hiện tại:</h5>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• 10 bài đăng/tháng</li>
                      <li>• 3 templates</li>
                      <li>• 2 lượt AI/ngày</li>
                    </ul>
                  </div>
                  <Link
                    href="/pricing"
                    className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
                  >
                    Nâng cấp lên Professional
                  </Link>
                </div>
              )}

              {userRole === 'professional' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Gói Professional bao gồm:</h5>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• 100 bài đăng/tháng</li>
                      <li>• 50 templates</li>
                      <li>• 20 lượt AI/ngày</li>
                      <li>• Phân tích chi tiết</li>
                    </ul>
                  </div>
                  <Link
                    href="/pricing"
                    className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium"
                  >
                    Nâng cấp lên Enterprise
                  </Link>
                </div>
              )}

              {userRole === 'enterprise' && (
                <div className="bg-white p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Gói Enterprise bao gồm:</h5>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Không giới hạn bài đăng</li>
                    <li>• Không giới hạn templates</li>
                    <li>• Không giới hạn AI</li>
                    <li>• API tích hợp</li>
                    <li>• Hỗ trợ dedicated</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

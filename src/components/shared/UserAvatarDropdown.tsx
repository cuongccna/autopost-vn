import React, { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  User, 
  Settings, 
  LogOut, 
  Crown, 
  Gem,
  ChevronDown,
  Star,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { UserProfileSettings } from './UserProfileSettings';

export const UserAvatarDropdown: React.FC = () => {
  const { data: session } = useSession();
  const { userRole } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'free':
        return {
          name: 'Miễn phí',
          icon: User,
          avatarBg: 'bg-gray-100',
          avatarBorder: 'border-gray-300',
          avatarIcon: 'text-gray-600',
          badge: 'bg-gray-100 text-gray-700'
        };
      case 'professional':
        return {
          name: 'Professional',
          icon: Crown,
          avatarBg: 'bg-blue-100',
          avatarBorder: 'border-blue-400',
          avatarIcon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700'
        };
      case 'enterprise':
        return {
          name: 'Enterprise',
          icon: Gem,
          avatarBg: 'bg-purple-100',
          avatarBorder: 'border-purple-400',
          avatarIcon: 'text-purple-600',
          badge: 'bg-purple-100 text-purple-700'
        };
      default:
        return {
          name: 'Miễn phí',
          icon: User,
          avatarBg: 'bg-gray-100',
          avatarBorder: 'border-gray-300',
          avatarIcon: 'text-gray-600',
          badge: 'bg-gray-100 text-gray-700'
        };
    }
  };

  const roleInfo = getRoleInfo(userRole);
  const RoleIcon = roleInfo.icon;

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (!session) return null;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Avatar Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 p-1 rounded-full border-2 ${roleInfo.avatarBorder} ${roleInfo.avatarBg} hover:shadow-md transition-all duration-200 group`}
        >
          {/* Avatar Image or Icon */}
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <RoleIcon className={`w-5 h-5 ${roleInfo.avatarIcon}`} />
            )}
          </div>
          
          {/* Role Indicator */}
          <div className="hidden sm:flex items-center space-x-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleInfo.badge}`}>
              {roleInfo.name}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
            {/* User Info Section */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full ${roleInfo.avatarBg} ${roleInfo.avatarBorder} border-2 flex items-center justify-center`}>
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <RoleIcon className={`w-6 h-6 ${roleInfo.avatarIcon}`} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 truncate">
                    {session.user?.name || 'Người dùng'}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {session.user?.email}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo.badge}`}>
                      {roleInfo.name}
                    </span>
                    {userRole !== 'enterprise' && (
                      <Link 
                        href="/pricing"
                        className="text-yellow-600 hover:text-yellow-700 text-xs flex items-center space-x-1"
                        onClick={() => setIsOpen(false)}
                      >
                        <Star className="w-3 h-3" />
                        <span>Nâng cấp</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* Profile Settings */}
              <button
                onClick={() => {
                  setShowProfileSettings(true);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Thông tin cá nhân</span>
              </button>

              {/* Settings */}
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Cài đặt</span>
              </Link>

              {/* Upgrade (if not enterprise) */}
              {userRole !== 'enterprise' && (
                <Link
                  href="/pricing"
                  onClick={() => setIsOpen(false)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-yellow-600 hover:text-yellow-700 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span>
                    {userRole === 'free' ? 'Nâng cấp lên Pro' : 'Nâng cấp lên Enterprise'}
                  </span>
                </Link>
              )}

              {/* Divider */}
              <hr className="my-2 border-gray-100" />

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center space-x-3 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <UserProfileSettings onClose={() => setShowProfileSettings(false)} />
        </div>
      )}
    </>
  );
};

'use client';

import { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

export default function PrivacySettings() {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutAllDevices = () => {
    // Sign out from all sessions
    window.location.href = '/api/auth/signout';
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
        <Shield className="w-5 h-5" />
        <span>Quyền riêng tư & Bảo mật</span>
      </h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="font-medium">Phiên đăng nhập</h3>
          <p className="text-sm text-gray-500 mb-3">Quản lý các thiết bị đã đăng nhập</p>
          
          {!showLogoutConfirm ? (
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Đăng xuất tất cả thiết bị
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-800 mb-1">
                    Bạn có chắc muốn đăng xuất khỏi tất cả thiết bị?
                  </h4>
                  <p className="text-sm text-red-700 mb-3">
                    Bạn sẽ cần đăng nhập lại.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleLogoutAllDevices}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>Mẹo bảo mật:</strong> Thay đổi mật khẩu định kỳ và không chia sẻ tài khoản với người khác.
          </p>
        </div>
      </div>
    </div>
  );
}

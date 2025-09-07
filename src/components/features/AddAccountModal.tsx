'use client';

import { useState } from 'react';
import { PROVIDERS } from '@/lib/constants';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (_provider: string) => void;
  onDisconnect: (_provider: string) => void;
  connectedProviders: string[];
}

const oauthSteps = {
  facebook: [
    '1. Chọn "Kết nối Facebook Page"',
    '2. Đăng nhập Facebook và cho phép quyền',
    '3. Chọn Page bạn muốn quản lý',
    '4. Xác nhận các quyền: pages_manage_posts, pages_read_engagement'
  ],
  instagram: [
    '1. Chọn "Kết nối Instagram Business"',
    '2. Đăng nhập Facebook (Instagram Business cần FB)',
    '3. Chọn Instagram Business Account',
    '4. Xác nhận quyền: instagram_basic, content_publish'
  ],
  zalo: [
    '1. Chọn "Kết nối Zalo OA"',
    '2. Đăng nhập Zalo Developer',
    '3. Chọn Official Account',
    '4. Xác nhận quyền gửi bài viết và media'
  ]
};

export default function AddAccountModal({ isOpen, onClose, onConnect, onDisconnect, connectedProviders }: AddAccountModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);

  // Debug log
  console.log('🔍 AddAccountModal - connectedProviders:', connectedProviders);

  const handleConnect = async (provider: string) => {
    // Show confirmation modal first
    setShowConfirmation(provider);
  };

  const handleConfirmConnect = async () => {
    if (!showConfirmation) return;
    
    setIsConnecting(true);
    setSelectedProvider(showConfirmation);
    
    // Call the real OAuth function from parent
    try {
      await onConnect(showConfirmation);
    } catch (error) {
      console.error('OAuth connection failed:', error);
    } finally {
      setIsConnecting(false);
      setSelectedProvider(null);
      setShowConfirmation(null);
    }
  };

  const handleCancelConnect = () => {
    setShowConfirmation(null);
  };

  const handleDisconnect = async (provider: string) => {
    setIsConnecting(true);
    
    try {
      await onDisconnect(provider);
    } catch (error) {
      console.error('Disconnect failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">Kết nối tài khoản mới</h3>
          <button 
            onClick={onClose}
            disabled={isConnecting}
            className="rounded-full p-2 hover:bg-gray-100 disabled:opacity-50" 
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-base font-medium mb-2">Chọn nền tảng để kết nối</h4>
            <p className="text-sm text-gray-600">
              Kết nối tài khoản social media để AutoPost VN có thể đăng bài tự động cho bạn.
            </p>
          </div>

          <div className="space-y-4">
            {Object.entries(PROVIDERS).map(([key, provider]) => {
              const isConnected = connectedProviders.includes(key);
              const isCurrentlyConnecting = isConnecting && selectedProvider === key;
              
              return (
                <div key={key} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        key === 'facebook' ? 'bg-blue-50' : 
                        key === 'instagram' ? 'bg-pink-50' : 
                        'bg-sky-50'
                      }`}>
                        {key === 'facebook' ? '🔵' : key === 'instagram' ? '🟣' : '🔷'}
                      </div>
                      <div>
                        <div className="font-medium">{provider.label}</div>
                        <div className="text-sm text-gray-500">
                          {key === 'facebook' && 'Đăng bài lên Facebook Pages'}
                          {key === 'instagram' && 'Đăng ảnh/video lên Instagram Business'}
                          {key === 'zalo' && 'Gửi tin nhắn qua Zalo Official Account'}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => isConnected ? handleDisconnect(key) : handleConnect(key)}
                      disabled={isConnecting}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        isConnected 
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          : isCurrentlyConnecting
                          ? 'bg-indigo-50 text-indigo-700 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {isConnected ? 'Hủy kết nối' : 
                       isCurrentlyConnecting ? 'Đang kết nối...' : 
                       'Kết nối'}
                    </button>
                  </div>
                  
                  {/* OAuth Steps */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-700 mb-2">Quy trình kết nối:</div>
                    <ol className="text-xs text-gray-600 space-y-1">
                      {oauthSteps[key as keyof typeof oauthSteps].map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  
                  {/* Permissions */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {key === 'facebook' && (
                      <>
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">pages_manage_posts</span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">pages_read_engagement</span>
                      </>
                    )}
                    {key === 'instagram' && (
                      <>
                        <span className="px-2 py-1 bg-pink-50 text-pink-700 text-xs rounded-md">instagram_basic</span>
                        <span className="px-2 py-1 bg-pink-50 text-pink-700 text-xs rounded-md">content_publish</span>
                      </>
                    )}
                    {key === 'zalo' && (
                      <>
                        <span className="px-2 py-1 bg-sky-50 text-sky-700 text-xs rounded-md">send_message</span>
                        <span className="px-2 py-1 bg-sky-50 text-sky-700 text-xs rounded-md">manage_oa</span>
                      </>
                    )}
                  </div>
                  
                  {/* Instagram Special Requirements */}
                  {key === 'instagram' && (
                    <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-600 text-sm">⚠️</span>
                        <div className="text-xs">
                          <div className="font-medium text-amber-800 mb-1">Yêu cầu đặc biệt cho Instagram:</div>
                          <ul className="text-amber-700 space-y-1">
                            <li>• Instagram phải là <strong>Business Account</strong></li>
                            <li>• Phải <strong>kết nối với Facebook Page</strong> trước</li>
                            <li>• Facebook Page phải có quyền quản lý Instagram</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Security Note */}
          <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-2">
              <span className="text-amber-600">🔒</span>
              <div className="text-sm">
                <div className="font-medium text-amber-800 mb-1">Bảo mật & Quyền riêng tư</div>
                <ul className="text-amber-700 space-y-1 text-xs">
                  <li>• Chúng tôi chỉ lưu trữ token được mã hóa, không lưu mật khẩu</li>
                  <li>• Token sẽ tự động làm mới trước khi hết hạn</li>
                  <li>• Bạn có thể ngắt kết nối bất cứ lúc nào trong cài đặt</li>
                  <li>• Dữ liệu tuân thủ tiêu chuẩn bảo mật quốc tế</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {isConnecting && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                Đang mở cửa sổ OAuth... Vui lòng hoàn tất việc đăng nhập.
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t text-center">
            <button
              onClick={onClose}
              disabled={isConnecting}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              {isConnecting ? 'Đang kết nối...' : 'Đóng'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  showConfirmation === 'facebook' ? 'bg-blue-50' : 
                  showConfirmation === 'instagram' ? 'bg-pink-50' : 
                  'bg-sky-50'
                }`}>
                  {showConfirmation === 'facebook' ? '🔵' : showConfirmation === 'instagram' ? '🟣' : '🔷'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    Kết nối {PROVIDERS[showConfirmation as keyof typeof PROVIDERS]?.label}
                  </h3>
                  <p className="text-sm text-gray-500">Xác nhận điều khoản trước khi tiếp tục</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600">⚠️</span>
                  <div className="text-sm">
                    <div className="font-medium text-amber-800 mb-2">Quan trọng - Đọc kỹ trước khi đồng ý:</div>
                    <ul className="text-amber-700 space-y-1 text-xs">
                      <li>• Bạn sẽ được chuyển hướng đến {PROVIDERS[showConfirmation as keyof typeof PROVIDERS]?.label}</li>
                      <li>• Cần đăng nhập và cấp quyền cho AutoPost VN</li>
                      <li>• Chúng tôi chỉ truy cập các quyền cần thiết để đăng bài</li>
                      <li>• Token được mã hóa và lưu trữ an toàn</li>
                      <li>• Bạn có thể thu hồi quyền bất cứ lúc nao</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="text-sm">
                  <div className="font-medium text-blue-800 mb-2">Quyền cần thiết:</div>
                  <div className="flex flex-wrap gap-1">
                    {showConfirmation === 'facebook' && (
                      <>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">public_profile</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">pages_show_list</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">pages_read_engagement</span>
                      </>
                    )}
                    {showConfirmation === 'instagram' && (
                      <>
                        <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-md">public_profile</span>
                        <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-md">public_profile</span>
                        <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-md">pages_show_list</span>
                      </>
                    )}
                    {showConfirmation === 'zalo' && (
                      <>
                        <span className="px-2 py-1 bg-sky-100 text-sky-700 text-xs rounded-md">userinfo</span>
                        <span className="px-2 py-1 bg-sky-100 text-sky-700 text-xs rounded-md">offline_access</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelConnect}
                  disabled={isConnecting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmConnect}
                  disabled={isConnecting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? 'Đang kết nối...' : 'Đồng ý & Kết nối'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

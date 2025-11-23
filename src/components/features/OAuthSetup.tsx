'use client';

import { useState, useEffect } from 'react';

interface OAuthSetupProps {
  provider: string;
  onSuccess?: (_accountData: any) => void;
  onError?: (_error: string) => void;
}

export default function OAuthSetup({ provider, onSuccess, onError }: OAuthSetupProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [setupStep, setSetupStep] = useState<'guide' | 'connecting' | 'success' | 'error'>('guide');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check for OAuth callback results in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    const oauthError = urlParams.get('oauth_error');
    const accountName = urlParams.get('account');

    if (oauthSuccess === provider) {
      setSetupStep('success');
      onSuccess?.({ provider, name: decodeURIComponent(accountName || '') });
      // Clean URL
      window.history.replaceState({}, '', '/app');
    } else if (oauthError) {
      setSetupStep('error');
      setErrorMessage(oauthError);
      onError?.(oauthError);
      // Clean URL
      window.history.replaceState({}, '', '/app');
    }
  }, [provider, onSuccess, onError]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setSetupStep('connecting');
    
    try {
      // Redirect to OAuth endpoint
      const oauthUrl = `/api/oauth/${provider}?action=connect`;
      window.location.href = oauthUrl;
    } catch (error) {
      setIsConnecting(false);
      setSetupStep('error');
      setErrorMessage('Failed to initiate OAuth flow');
      onError?.('Failed to initiate OAuth flow');
    }
  };

  const getProviderInfo = () => {
    const infos = {
      facebook: {
        name: 'Facebook Page',
        icon: '📘',
        description: 'Kết nối Fanpage Facebook để đăng bài tự động',
        requirements: [
          'Bạn phải là Admin của Fanpage',
          'Fanpage phải được phê duyệt và công khai',
          'Tài khoản Facebook phải được xác thực',
        ],
        permissions: [
          'Đăng bài lên timeline',
          'Đọc thông tin tương tác',
          'Quản lý nội dung',
        ],
      },
      instagram: {
        name: 'Instagram Business',
        icon: '📸',
        description: 'Kết nối tài khoản Instagram Business để đăng bài',
        requirements: [
          'Tài khoản Instagram phải chuyển sang Business',
          'Phải kết nối với Fanpage Facebook',
          'Được phê duyệt Instagram Basic Display API',
        ],
        permissions: [
          'Đăng hình ảnh và video',
          'Đọc thông tin profile',
          'Xem insights cơ bản',
        ],
      },
      zalo: {
        name: 'Zalo Official Account',
        icon: '💬',
        description: 'Kết nối Zalo OA để gửi tin nhắn và đăng bài',
        requirements: [
          'Phải có Zalo Official Account được phê duyệt',
          'OA phải ở trạng thái hoạt động',
          'Có quyền quản lý OA',
          '⚠️ YÊU CẦU: OA phải nâng cấp lên GÓI TRẢ PHÍ để sử dụng API đăng bài (xem chi tiết: https://zalo.cloud/oa/pricing)',
        ],
        permissions: [
          'Gửi tin nhắn tới followers',
          'Đăng bài lên timeline OA (Chỉ gói trả phí)',
          'Đọc thông tin tương tác',
        ],
      },
    };
    return infos[provider as keyof typeof infos];
  };

  const providerInfo = getProviderInfo();

  if (!providerInfo) {
    return <div className="text-red-500">Provider không được hỗ trợ</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border shadow-sm p-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{providerInfo.icon}</div>
        <h3 className="text-xl font-semibold mb-2">
          Kết nối {providerInfo.name}
        </h3>
        <p className="text-gray-600 text-sm">
          {providerInfo.description}
        </p>
        {provider === 'zalo' && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 text-lg">⚠️</span>
              <div className="text-left text-sm">
                <p className="font-semibold text-amber-900 mb-1">Yêu cầu gói trả phí</p>
                <p className="text-amber-800">
                  Zalo OA cần nâng cấp lên{' '}
                  <a 
                    href="https://zalo.cloud/oa/pricing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-900 font-medium"
                  >
                    gói trả phí
                  </a>
                  {' '}để sử dụng API đăng bài tự động. Bạn vẫn có thể kết nối ngay để chuẩn bị sẵn tài khoản.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {setupStep === 'guide' && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Yêu cầu:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {providerInfo.requirements.map((req, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Quyền cần cấp:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {providerInfo.permissions.map((perm, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  {perm}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isConnecting ? 'Đang kết nối...' : `Kết nối ${providerInfo.name}`}
          </button>

          <div className="text-xs text-gray-500 text-center">
            Bằng cách kết nối, bạn đồng ý cho AutoPost VN truy cập vào tài khoản của bạn 
            với các quyền hạn được liệt kê ở trên.
          </div>
        </div>
      )}

      {setupStep === 'connecting' && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Đang chuyển hướng đến {providerInfo.name}...</div>
          <div className="text-sm text-gray-500 mt-2">
            Vui lòng đăng nhập và cấp quyền cho ứng dụng
          </div>
        </div>
      )}

      {setupStep === 'success' && (
        <div className="text-center py-8">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <div className="text-green-600 font-semibold mb-2">Kết nối thành công!</div>
          <div className="text-gray-600 text-sm">
            Tài khoản {providerInfo.name} đã được kết nối thành công.
            Bạn có thể bắt đầu đăng bài ngay bây giờ.
          </div>
        </div>
      )}

      {setupStep === 'error' && (
        <div className="text-center py-8">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <div className="text-red-600 font-semibold mb-2">Kết nối thất bại</div>
          <div className="text-gray-600 text-sm mb-4">
            {errorMessage === 'access_denied' ? 
              'Bạn đã từ chối cấp quyền. Vui lòng thử lại và chấp nhận các quyền cần thiết.' :
              `Lỗi: ${errorMessage}`
            }
          </div>
          <button
            onClick={() => setSetupStep('guide')}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}

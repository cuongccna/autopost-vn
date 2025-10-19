'use client';

import { useState } from 'react';
import { PROVIDERS } from '@/lib/constants';
import OAuthSetup from './OAuthSetup';

interface Account {
  id: string;
  name: string;
  provider: string;
  status: string;
  pageId?: string;
  tokenExpiry?: string;
  userEmail?: string; // Add user association
}

interface AccountsManagementProps {
  accounts: Account[];
  onRefreshToken: (_accountId: string) => void;
  onDisconnectAccount: (_accountId: string) => void;
  onConnectAccount: (_provider: string) => void;
  onOpenAddModal?: () => void;
  currentUserEmail?: string; // Add current user context
}

export default function AccountsManagement({ 
  accounts, 
  onRefreshToken, 
  onDisconnectAccount, 
  onConnectAccount,
  onOpenAddModal,
  currentUserEmail
}: AccountsManagementProps) {
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [showOAuthSetup, setShowOAuthSetup] = useState<string | null>(null);

  const handleRefreshToken = async (accountId: string) => {
    setRefreshingId(accountId);
    await onRefreshToken(accountId);
    setRefreshingId(null);
  };

  // Filter accounts by current user
  const userAccounts = currentUserEmail ? 
    accounts.filter(acc => acc.userEmail === currentUserEmail) : 
    accounts;

  const hasProvider = (provider: string) => {
    return userAccounts.some(acc => acc.provider === provider);
  };

  const handleConnectClick = (provider: string) => {
    setShowOAuthSetup(provider);
  };

  const handleOAuthSuccess = (accountData: any) => {
    setShowOAuthSetup(null);
    onConnectAccount(accountData.provider);
    // Optionally refresh the accounts list
  };

  const handleOAuthError = (error: string) => {
    console.error('OAuth Error:', error);
    setShowOAuthSetup(null);
  };

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-base font-semibold">Quản lý tài khoản & kênh</div>
        <div className="text-xs text-gray-500">Mẹo: Kết nối FB Page, IG Biz, Zalo OA bằng OAuth</div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Connected accounts detail */}
        <div>
          <h4 className="mb-2 font-medium">Đang kết nối</h4>
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {PROVIDERS[account.provider as keyof typeof PROVIDERS]?.label || account.provider}
                    </div>
                    {account.pageId && (
                      <div className="mt-0.5 text-xs text-gray-400">ID: {account.pageId}</div>
                    )}
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                    {account.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <button 
                    onClick={() => handleRefreshToken(account.id)}
                    disabled={refreshingId === account.id}
                    className="rounded-lg border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {refreshingId === account.id ? 'Đang làm mới...' : 'Làm mới token'}
                  </button>
                  <button 
                    onClick={() => onDisconnectAccount(account.id)}
                    className="rounded-lg border px-2 py-1 hover:bg-gray-50"
                  >
                    Ngắt kết nối
                  </button>
                </div>
                {account.tokenExpiry && (
                  <div className="mt-1 text-xs text-amber-600">
                    Token hết hạn: {new Date(account.tokenExpiry).toLocaleDateString('vi-VN')}
                  </div>
                )}
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="rounded-xl border border-dashed p-4 text-center text-sm text-gray-500">
                Chưa có tài khoản nào được kết nối
              </div>
            )}
          </div>
        </div>
        
        {/* Connect new */}
        <div>
          <h4 className="mb-2 font-medium">Kết nối mới</h4>
          <div className="space-y-2">
            <button 
              onClick={() => handleConnectClick('facebook')}
              disabled={hasProvider('facebook')}
              className="w-full rounded-xl border px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔵 Kết nối Facebook Page
              {hasProvider('facebook') && (
                <span className="float-right text-xs text-green-600">✓ Đã kết nối</span>
              )}
            </button>
            
            <button 
              onClick={() => handleConnectClick('instagram')}
              disabled={hasProvider('instagram')}
              className="w-full rounded-xl border px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🟣 Kết nối Instagram Business
              {hasProvider('instagram') && (
                <span className="float-right text-xs text-green-600">✓ Đã kết nối</span>
              )}
            </button>
            
            <button 
              onClick={() => handleConnectClick('zalo')}
              disabled={hasProvider('zalo')}
              className="w-full rounded-xl border px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔷 Kết nối Zalo OA
              {hasProvider('zalo') && (
                <span className="float-right text-xs text-green-600">✓ Đã kết nối</span>
              )}
            </button>
            
            {/* Add universal connect button */}
            {onOpenAddModal && (
              <button 
                onClick={onOpenAddModal}
                className="w-full rounded-xl border border-dashed border-indigo-300 px-3 py-2 text-left hover:bg-indigo-50 text-indigo-600 font-medium"
              >
                ➕ Thêm tài khoản mới
              </button>
            )}
          </div>
          
          <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
            <div className="font-medium mb-1">Quyền & Scopes</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Facebook Page: pages_show_list, pages_read_engagement</li>
              <li>Instagram Biz: pages_show_list, pages_read_engagement</li>
              <li>Zalo OA: gửi bài viết, media</li>
              <li>Buffer: manage_all_profiles, schedule_posts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* OAuth Setup Modal */}
      {showOAuthSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative">
            <button
              onClick={() => setShowOAuthSetup(null)}
              className="absolute -top-2 -right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 z-10"
            >
              ✕
            </button>
            <OAuthSetup
              provider={showOAuthSetup}
              onSuccess={handleOAuthSuccess}
              onError={handleOAuthError}
            />
          </div>
        </div>
      )}
    </section>
  );
}

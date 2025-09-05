'use client';

import { PROVIDERS } from '@/lib/constants';

interface Account {
  name: string;
  provider: string;
  status: string;
}

interface AccountsSidebarProps {
  accounts: Account[];
  onAddAccount: () => void;
  connectedProviders?: string[];
}

export default function AccountsSidebar({ accounts, onAddAccount, connectedProviders = [] }: AccountsSidebarProps) {
  const hasAvailableProviders = connectedProviders.length < Object.keys(PROVIDERS).length;
  
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 text-base font-semibold">Tài khoản kết nối</div>
      <div className="space-y-3">
        {accounts.map((account, index) => (
          <div key={index} className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="font-medium">{account.name}</div>
              <div className="mt-0.5 text-xs text-gray-500">
                {PROVIDERS[account.provider as keyof typeof PROVIDERS]?.label || account.provider}
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
              {account.status}
            </span>
          </div>
        ))}
      </div>
      <button 
        onClick={onAddAccount}
        disabled={!hasAvailableProviders}
        className={`w-full rounded-xl border border-dashed p-2 text-sm transition-colors ${
          hasAvailableProviders 
            ? 'text-gray-600 hover:bg-gray-50 hover:border-gray-300' 
            : 'text-gray-400 cursor-not-allowed'
        }`}
        title={hasAvailableProviders ? 'Thêm tài khoản mới' : 'Đã kết nối tất cả platforms'}
      >
        {hasAvailableProviders ? '+ Thêm tài khoản' : '✓ Đã kết nối hết'}
      </button>
    </section>
  );
}

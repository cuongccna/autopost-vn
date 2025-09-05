'use client';

import { useState } from 'react';

interface MobileSidebarProps {
  currentTab: string;
  onTabChange: (_tab: string) => void;
}

const tabs = [
  { id: 'calendar', label: 'Lịch', icon: '📅' },
  { id: 'queue', label: 'Hàng đợi', icon: '📄' },
  { id: 'analytics', label: 'Phân tích', icon: '📈' },
  { id: 'accounts', label: 'Tài khoản', icon: '👥' },
  { id: 'settings', label: 'Cài đặt', icon: '⚙️' },
];

export default function MobileSidebar({ currentTab, onTabChange }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
            <div className="p-4">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-indigo-600"></div>
                  <div className="text-lg font-bold">AutoPost VN</div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
              
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      setIsOpen(false);
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-left hover:bg-gray-50 ${
                      currentTab === tab.id ? 'bg-indigo-50 text-indigo-700' : ''
                    }`}
                  >
                    <span className="mr-2 inline-flex h-4 w-4 align-middle">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import MobileSidebar from './MobileSidebar';

interface TopbarProps {
  onOpenCompose: () => void;
  currentTab: string;
  onTabChange: (_tab: string) => void;
}

export default function Topbar({ onOpenCompose, currentTab, onTabChange }: TopbarProps) {
  return (
    <div className="flex items-center justify-between border-b bg-white px-4 py-3">
      <div className="flex items-center gap-4">
        <MobileSidebar currentTab={currentTab} onTabChange={onTabChange} />
        <div className="relative hidden md:block">
          <input 
            className="w-80 rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
            placeholder="Tìm bài, kênh, lỗi…" 
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onOpenCompose}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <span className="hidden sm:inline">➕ Tạo bài đăng</span>
          <span className="sm:hidden">➕</span>
        </button>
        <div className="h-8 w-8 rounded-full bg-gray-200"></div>
      </div>
    </div>
  );
}

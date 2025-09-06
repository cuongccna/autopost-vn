'use client';

interface SidebarProps {
  currentTab: string;
  onTabChange: (_tab: string) => void;
  goldenHours?: string[];
}

const tabs = [
  { id: 'calendar', label: 'Lịch & Lên lịch', icon: '📅' },
  { id: 'queue', label: 'Hàng đợi & Nhật ký', icon: '📄' },
  { id: 'analytics', label: 'Phân tích', icon: '📈' },
  { id: 'activities', label: 'Hoạt động', icon: '🔍' },
  { id: 'accounts', label: 'Tài khoản', icon: '👥' },
  { id: 'settings', label: 'Cài đặt', icon: '⚙️' },
];

const goldenHours = ['09:00', '12:30', '20:00'];

export default function Sidebar({ currentTab, onTabChange, goldenHours: customGoldenHours }: SidebarProps) {
  const hours = customGoldenHours || goldenHours;
  return (
    <aside className="hidden w-72 flex-col border-r bg-white p-4 md:flex">
      <div className="mb-6 flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-indigo-600"></div>
        <div className="text-lg font-bold">AutoPost VN</div>
      </div>
      
      <nav className="space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full rounded-xl px-3 py-2 text-left hover:bg-gray-50 ${
              currentTab === tab.id ? 'bg-indigo-50 text-indigo-700' : ''
            }`}
          >
            <span className="mr-2 inline-flex h-4 w-4 align-middle">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
      
      <div className="mt-auto rounded-xl bg-gradient-to-br from-indigo-50 to-white p-3 text-sm">
        <div className="font-medium">Gợi ý giờ vàng hôm nay</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {hours.map((hour) => (
            <span
              key={hour}
              className="rounded-md bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700 ring-1 ring-yellow-200"
            >
              {hour}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}

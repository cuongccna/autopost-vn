'use client';

interface Tab {
  id: string;
  label: string;
}

interface TabSelectorProps {
  tabs: Tab[];
  currentTab: string;
  onTabChange: (_tabId: string) => void;
}

export default function TabSelector({ tabs, currentTab, onTabChange }: TabSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`rounded-full px-3 py-1.5 text-sm ring-1 ${
            currentTab === tab.id 
              ? 'bg-indigo-600 text-white ring-indigo-600' 
              : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

'use client';

interface SubIndicator {
  label: string;
  value: string | number;
  color?: string;
}

interface StatsCard {
  label: string;
  value: string | number;
  progress?: number;
  subIndicators?: SubIndicator[];
}

interface StatsCardsProps {
  stats: StatsCard[];
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'facebook': return 'text-blue-600 bg-blue-50';
      case 'instagram': return 'text-pink-600 bg-pink-50';
      case 'zalo': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {stats.map((stat, index) => (
        <div key={index} className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">{stat.label}</div>
          <div className="mt-1 text-2xl font-semibold">{stat.value}</div>
          
          {/* Sub-indicators */}
          {stat.subIndicators && stat.subIndicators.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {stat.subIndicators.map((sub, subIndex) => (
                <span 
                  key={subIndex}
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    sub.color || getProviderColor(sub.label)
                  }`}
                >
                  {sub.label}: {sub.value}
                </span>
              ))}
            </div>
          )}
          
          <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
            <div 
              className="h-2 rounded-full bg-indigo-500" 
              style={{
                width: `${
                  stat.progress ?? 
                  (typeof stat.value === 'number' ? Math.min(stat.value * 5, 100) : 80)
                }%`
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

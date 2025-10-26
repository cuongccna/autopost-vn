import { WorkspaceSettingsService, WorkspaceSettings } from '@/lib/services/workspace-settings.service';

interface GoldenHoursSuggestionProps {
  settings: WorkspaceSettings | null;
  onSelectTime: (time: string) => void;
}

export default function GoldenHoursSuggestion({ settings, onSelectTime }: GoldenHoursSuggestionProps) {
  if (!settings || !settings.scheduling.goldenHours.length) {
    return null;
  }

  const goldenHours = settings.scheduling.goldenHours;
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl">⭐</div>
        <div className="flex-1">
          <h3 className="font-medium text-amber-900 mb-1">Giờ vàng đề xuất</h3>
          <p className="text-sm text-amber-700 mb-3">
            Đăng bài vào khung giờ vàng để tăng tương tác
          </p>
          <div className="flex flex-wrap gap-2">
            {goldenHours.map((hour, index) => {
              const [h, m] = hour.split(':').map(Number);
              const hourMinutes = h * 60 + m;
              const isPast = hourMinutes < currentTimeMinutes;
              const isSoon = !isPast && hourMinutes - currentTimeMinutes <= 30;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    today.setHours(h, m, 0, 0);
                    // If time is past, schedule for tomorrow
                    if (isPast) {
                      today.setDate(today.getDate() + 1);
                    }
                    const timeString = today.toISOString().slice(0, 16);
                    onSelectTime(timeString);
                  }}
                  disabled={isPast}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isPast
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isSoon
                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md'
                      : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  {hour}
                  {isSoon && ' 🔥'}
                  {isPast && ' (đã qua)'}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-amber-600 mt-2">
            💡 Múi giờ: {settings.scheduling.timezone}
          </p>
        </div>
      </div>
    </div>
  );
}

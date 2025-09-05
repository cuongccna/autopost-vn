'use client';

interface SystemLogProps {
  logs: string[];
}

export default function SystemLog({ logs }: SystemLogProps) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 text-base font-semibold">Nhật ký hệ thống</div>
      <ul className="space-y-2 text-sm">
        {logs.map((log, index) => (
          <li key={index}>{log}</li>
        ))}
        {logs.length === 0 && (
          <li className="text-gray-500">Chưa có hoạt động nào</li>
        )}
      </ul>
    </section>
  );
}

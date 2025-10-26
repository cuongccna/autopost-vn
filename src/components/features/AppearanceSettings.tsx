'use client';

import { useState, useEffect } from 'react';
import { Palette, Sun } from 'lucide-react';
import { toast } from '@/lib/utils/toast';

type Theme = 'light';

export default function AppearanceSettings() {
  const [selectedTheme] = useState<Theme>('light');

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
        <Palette className="w-5 h-5" />
        <span>Giao diện</span>
      </h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-3">Theme</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 border-2 rounded-xl border-blue-500 bg-blue-50 text-blue-700 shadow-md">
              <div className="flex items-center space-x-3 mb-2">
                <Sun className="w-6 h-6 text-blue-600" />
                <span className="font-medium text-lg">Sáng</span>
              </div>
              <p className="text-sm text-gray-500">Giao diện sáng, dễ nhìn ban ngày</p>
              <div className="mt-3 flex items-center space-x-1 text-blue-600 text-sm font-medium">
                <span>✓</span>
                <span>Đang sử dụng</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Thông báo:</strong> Chế độ Dark Mode đang được phát triển và sẽ có trong phiên bản tiếp theo. 
            Hiện tại chỉ hỗ trợ giao diện sáng để đảm bảo trải nghiệm tốt nhất.
          </p>
        </div>
      </div>
    </div>
  );
}

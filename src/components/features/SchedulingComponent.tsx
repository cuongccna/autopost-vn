'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGate from '@/components/shared/PermissionGate';
import { 
  Calendar,
  Clock,
  Sparkles,
  Target,
  Zap,
  Crown,
  TrendingUp,
  Users,
  BarChart3,
  Settings
} from 'lucide-react';

interface SchedulingOptimization {
  platform: string;
  suggestedTimes: {
    time: string;
    score: number;
    reason: string;
    audience: string;
  }[];
  insights: {
    peakHours: string[];
    audienceActivity: string;
    competitorAnalysis: string;
  };
}

interface SchedulingProps {
  selectedPlatforms: string[];
  contentType?: string;
  onTimeSelect: (time: string) => void;
}

export default function SchedulingComponent({ selectedPlatforms, contentType = 'general', onTimeSelect }: SchedulingProps) {
  const { hasFeature, userRole } = usePermissions();
  const [optimizations, setOptimizations] = useState<SchedulingOptimization[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');

  const canUseAI = hasFeature('scheduling', 'aiOptimized');
  const hasBasicScheduling = hasFeature('scheduling', 'basic');

  // Basic time suggestions for free users
  const basicTimeSlots = [
    { time: '07:00', label: 'Sáng sớm (7:00)', description: 'Bắt đầu ngày mới' },
    { time: '12:00', label: 'Trưa (12:00)', description: 'Giờ nghỉ trưa' },
    { time: '18:00', label: 'Chiều (18:00)', description: 'Sau giờ làm việc' },
    { time: '21:00', label: 'Tối (21:00)', description: 'Thời gian thư giãn' },
  ];

  const generateAIOptimizations = async () => {
    if (!canUseAI) return;
    
    setLoading(true);
    try {
      // Mock AI optimization data - replace with actual API call
      const mockOptimizations: SchedulingOptimization[] = selectedPlatforms.map(platform => ({
        platform,
        suggestedTimes: [
          {
            time: platform === 'facebook' ? '19:30' : platform === 'instagram' ? '21:00' : '20:15',
            score: Math.floor(Math.random() * 20) + 80,
            reason: 'Thời điểm có nhiều người dùng online nhất',
            audience: 'Dân văn phòng, độ tuổi 25-40'
          },
          {
            time: platform === 'facebook' ? '12:30' : platform === 'instagram' ? '13:15' : '12:45',
            score: Math.floor(Math.random() * 15) + 70,
            reason: 'Giờ nghỉ trưa, người dùng thường check social media',
            audience: 'Nhân viên văn phòng, sinh viên'
          },
          {
            time: platform === 'facebook' ? '07:45' : platform === 'instagram' ? '08:30' : '08:00',
            score: Math.floor(Math.random() * 10) + 65,
            reason: 'Đầu ngày, checking tin tức và updates',
            audience: 'Early birds, người đi làm sớm'
          }
        ],
        insights: {
          peakHours: ['07:00-09:00', '12:00-13:00', '19:00-22:00'],
          audienceActivity: `${platform} có lượng truy cập cao nhất vào buổi tối và giờ nghỉ trưa`,
          competitorAnalysis: 'Đối thủ chủ yếu đăng vào 20:00-21:00, nên tránh khung giờ này'
        }
      }));

      setTimeout(() => {
        setOptimizations(mockOptimizations);
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error generating AI optimizations:', error);
      setLoading(false);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    onTimeSelect(time);
  };

  if (!hasBasicScheduling) {
    return (
      <PermissionGate feature="scheduling" subFeature="basic">
        <div></div>
      </PermissionGate>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Lên lịch đăng bài</h3>
        </div>
        
        {canUseAI && (
          <button
            onClick={generateAIOptimizations}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Đang phân tích...' : 'Tối ưu thời gian (AI)'}
          </button>
        )}
      </div>

      {/* Basic Scheduling */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-600" />
          Khung giờ phổ biến
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {basicTimeSlots.map((slot) => (
            <button
              key={slot.time}
              onClick={() => handleTimeSelect(slot.time)}
              className={`p-3 border rounded-lg text-left transition-all ${
                selectedTime === slot.time
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-900">{slot.label}</div>
              <div className="text-xs text-gray-500 mt-1">{slot.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* AI Optimization Results */}
      <PermissionGate
        feature="scheduling"
        subFeature="aiOptimized"
        fallback={
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
            <div className="text-center">
              <Crown className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-blue-900 mb-2">
                Lên lịch thông minh với AI
              </h4>
              <p className="text-blue-700 mb-4">
                Tối ưu thời gian đăng bài dựa trên phân tích audience, competitor và xu hướng
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm">
                <div className="bg-white rounded-lg p-3">
                  <Target className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                  <div className="font-medium">Phân tích audience</div>
                  <div className="text-gray-600">Hiểu rõ khi nào khách hàng online</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                  <div className="font-medium">Theo dõi xu hướng</div>
                  <div className="text-gray-600">Tận dụng trending topics</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <BarChart3 className="w-5 h-5 text-green-600 mx-auto mb-2" />
                  <div className="font-medium">Phân tích competitor</div>
                  <div className="text-gray-600">Tránh khung giờ cạnh tranh cao</div>
                </div>
              </div>
              
              <button className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Nâng cấp lên Professional - 299k/tháng
              </button>
            </div>
          </div>
        }
      >
        {optimizations.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Gợi ý thời gian tối ưu (AI)
              <Crown className="w-4 h-4 text-yellow-600" />
            </h4>
            
            {optimizations.map((optimization) => (
              <div key={optimization.platform} className="bg-white border rounded-xl p-6">
                {/* Platform Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {optimization.platform.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 capitalize">{optimization.platform}</h5>
                    <p className="text-xs text-gray-500">Tối ưu cho nền tảng này</p>
                  </div>
                </div>

                {/* Suggested Times */}
                <div className="space-y-3 mb-4">
                  {optimization.suggestedTimes.map((suggestion, index) => (
                    <button
                      key={suggestion.time}
                      onClick={() => handleTimeSelect(suggestion.time)}
                      className={`w-full p-4 border rounded-lg text-left transition-all ${
                        selectedTime === suggestion.time
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            index === 0 ? 'bg-green-100 text-green-700' :
                            index === 1 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {index === 0 ? 'Tốt nhất' : index === 1 ? 'Tốt' : 'Khả thi'}
                          </div>
                          <span className="font-semibold text-lg">{suggestion.time}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-purple-600">
                            Score: {suggestion.score}/100
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-1">{suggestion.reason}</div>
                      <div className="text-xs text-gray-500">
                        <Users className="w-3 h-3 inline mr-1" />
                        {suggestion.audience}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Insights */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h6 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Insights chi tiết
                  </h6>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Khung giờ vàng: </span>
                      <span className="text-gray-600">{optimization.insights.peakHours.join(', ')}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Hoạt động audience: </span>
                      <span className="text-gray-600">{optimization.insights.audienceActivity}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Phân tích đối thủ: </span>
                      <span className="text-gray-600">{optimization.insights.competitorAnalysis}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PermissionGate>

      {/* Loading State */}
      {loading && (
        <div className="bg-white border rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h4 className="font-medium text-gray-900 mb-2">Đang phân tích dữ liệu...</h4>
          <p className="text-sm text-gray-600">
            AI đang phân tích audience behavior, competitor activity và trending times
          </p>
        </div>
      )}
    </div>
  );
}

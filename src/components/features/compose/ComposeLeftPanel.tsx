'use client';

import { useState } from 'react';
import { activityLogger } from '@/lib/services/activityLogger';
import { useAIRateLimit } from '@/hooks/useAIRateLimit';
import { useToast } from '@/components/ui/Toast';
import type { AIContext } from '@/lib/services/gemini';

interface ComposeData {
  title: string;
  content: string;
  channels: string[];
  scheduleAt: string;
  mediaUrls: string[];
  postId?: string;
  metadata?: {
    type?: 'social' | 'video';
    platform: string;
    ratio: string;
    hashtags?: string;
    cta?: string;
    brandColor?: string;
    template?: string;
    duration?: number;
    hook?: string;
    beats?: { time: number; text: string; }[];
    sub?: string;
    overlayCTA?: string;
  };
}

interface ComposeLeftPanelProps {
  activeTab: 'social' | 'video';
  onTabChange: (tab: 'social' | 'video') => void;
  composeData: Partial<ComposeData>;
  onDataChange: (data: Partial<ComposeData>) => void;
}

/**
 * Build rich AI context from available data
 */
const buildAIContext = (composeData: Partial<ComposeData>): AIContext => {
  const now = new Date();
  const month = now.getMonth() + 1; // 0-11 -> 1-12
  
  // Determine seasonal context for Vietnam
  let seasonalContext = '';
  if (month === 1 || month === 2) {
    seasonalContext = 'Tết Nguyên Đán, mùa xuân, năm mới';
  } else if (month === 4 || month === 5) {
    seasonalContext = 'Mùa hè, kỳ nghỉ lễ 30/4 - 1/5';
  } else if (month === 9) {
    seasonalContext = 'Mùa khai giảng, quốc khánh 2/9';
  } else if (month === 12) {
    seasonalContext = 'Giáng sinh, cuối năm, mua sắm tết';
  } else if (month === 3) {
    seasonalContext = 'Mùa xuân, 8/3 Quốc tế Phụ nữ';
  } else if (month === 10) {
    seasonalContext = 'Mùa thu, 20/10 Ngày Phụ nữ Việt Nam';
  }
  
  const context: AIContext = {
    // Extract from template/metadata if available
    primaryGoal: composeData.metadata?.template?.includes('promo') || composeData.metadata?.template?.includes('sale') 
      ? 'conversion' 
      : composeData.metadata?.template?.includes('tips') || composeData.metadata?.template?.includes('tutorial')
      ? 'education'
      : 'engagement',
    
    // Seasonal context for Vietnam
    seasonalContext,
    
    // Extract location (default to Vietnam)
    location: 'Việt Nam',
    
    // Try to extract product type from content/title
    productType: composeData.metadata?.type === 'video' ? 'Video content' : 'Social post',
  };
  
  return context;
};

const templates = [
  {
    id: 'flash-promo',
    name: 'Flash Promo',
    description: 'Khuyến mãi nhanh',
    ratio: '1:1',
    content: '🔥 FLASH SALE 50% 🔥\n\nChỉ còn 24h cuối cùng!\nMua ngay tại: [link]\n\n#flashsale #khuyenmai #sale50'
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Ra mắt sản phẩm',
    ratio: '4:5',
    content: '🚀 RA MẮT SẢN PHẨM MỚI!\n\nTrải nghiệm ngay hôm nay\nĐặt hàng: [link]\n\n#newproduct #launch #innovation'
  },
  {
    id: 'testimonial',
    name: 'Testimonial',
    description: 'Phản hồi khách hàng',
    ratio: '9:16',
    content: '⭐ KHÁCH HÀNG NÓI GÌ VỀ CHÚNG TÔI\n\n"Sản phẩm tuyệt vời!"\n- Anh/Chị [Tên]\n\n#testimonial #review #feedback'
  },
  {
    id: 'tips',
    name: 'Tips & Tricks',
    description: 'Mẹo hay',
    ratio: '1:1',
    content: '💡 MẸO HAY HÔM NAY\n\n5 cách để...\n1. [Mẹo 1]\n2. [Mẹo 2]\n3. [Mẹo 3]\n\n#tips #tricks #helpful'
  }
];

const videoTemplates = [
  {
    id: 'product-demo',
    name: 'Giới thiệu sản phẩm',
    description: 'Demo tính năng sản phẩm',
    ratio: '9:16',
    duration: 30,
    hook: 'Bạn có biết rằng...',
    content: 'Giới thiệu tính năng nổi bật của sản phẩm trong 30 giây',
    beats: [
      { time: 0, text: 'Hook: Thu hút sự chú ý' },
      { time: 5, text: 'Vấn đề: Khách hàng gặp phải' },
      { time: 15, text: 'Giải pháp: Sản phẩm giải quyết' },
      { time: 25, text: 'CTA: Kêu gọi hành động' }
    ]
  },
  {
    id: 'behind-scenes',
    name: 'Hậu trường',
    description: 'Quy trình làm việc',
    ratio: '9:16', 
    duration: 45,
    hook: 'Bạn có bao giờ tự hỏi...',
    content: 'Khám phá quy trình làm việc, văn hóa công ty',
    beats: [
      { time: 0, text: 'Mở đầu: Giới thiệu chủ đề' },
      { time: 10, text: 'Quy trình: Thực tế làm việc' },
      { time: 30, text: 'Insight: Thông tin thú vị' },
      { time: 40, text: 'Kết thúc: Ấn tượng cuối' }
    ]
  },
  {
    id: 'tutorial',
    name: 'Hướng dẫn',
    description: 'Tutorial từng bước',
    ratio: '9:16',
    duration: 60,
    hook: 'Học cách...',
    content: 'Hướng dẫn từng bước cách sử dụng sản phẩm/dịch vụ',
    beats: [
      { time: 0, text: 'Giới thiệu: Bài học hôm nay' },
      { time: 10, text: 'Bước 1: Chuẩn bị' },
      { time: 25, text: 'Bước 2: Thực hiện' },
      { time: 40, text: 'Bước 3: Hoàn thiện' },
      { time: 55, text: 'Tóm tắt: Kết quả & CTA' }
    ]
  },
  {
    id: 'user-generated',
    name: 'Nội dung người dùng',
    description: 'Trải nghiệm khách hàng',
    ratio: '9:16',
    duration: 30,
    hook: 'Khách hàng nói gì về chúng tôi...',
    content: 'Chia sẻ trải nghiệm thực tế từ khách hàng',
    beats: [
      { time: 0, text: 'Giới thiệu: Khách hàng' },
      { time: 8, text: 'Câu chuyện: Trải nghiệm' },
      { time: 20, text: 'Kết quả: Thành công đạt được' },
      { time: 27, text: 'CTA: Thử ngay hôm nay' }
    ]
  },
  {
    id: 'trending-topic',
    name: 'Xu hướng hot',
    description: 'Kết hợp trend hiện tại',
    ratio: '9:16',
    duration: 20,
    hook: 'Trend mới nhất...',
    content: 'Kết hợp thương hiệu với xu hướng hiện tại',
    beats: [
      { time: 0, text: 'Trend: Xu hướng hot' },
      { time: 7, text: 'Kết nối: Liên quan thương hiệu' },
      { time: 15, text: 'Hành động: Tương tác ngay' }
    ]
  }
];

const platforms = [
  { key: 'facebook', label: 'Facebook Page', icon: '📘', available: true },
  { key: 'instagram', label: 'Instagram', icon: '📷', available: true },
  { key: 'zalo', label: 'Zalo OA', icon: '💬', available: true }
];

const ratios = [
  { key: '1:1', label: '1:1 (Vuông)', description: 'Tỉ lệ vuông (Instagram, Facebook)' },
  { key: '4:5', label: '4:5 (Dọc)', description: 'Tỉ lệ dọc (Instagram Feed)' },
  { key: '9:16', label: '9:16 (Story)', description: 'Tỉ lệ Story (Instagram, Facebook)' },
  { key: '16:9', label: '16:9 (Ngang)', description: 'Tỉ lệ ngang (Facebook, YouTube)' }
];

const videoRatios = [
  { key: '9:16', label: '9:16 (Dọc)', description: 'Dọc - TikTok, Instagram Reels, YouTube Shorts' },
  { key: '16:9', label: '16:9 (Ngang)', description: 'Ngang - YouTube, Facebook Video' },
  { key: '1:1', label: '1:1 (Vuông)', description: 'Vuông - Instagram, Facebook Feed' },
  { key: '4:5', label: '4:5 (Dọc nhẹ)', description: 'Dọc nhẹ - Instagram Feed tối ưu' }
];

export default function ComposeLeftPanel({
  activeTab,
  onTabChange,
  composeData,
  onDataChange
}: ComposeLeftPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<{
    caption: boolean;
    hashtags: boolean;
    script: boolean;
    hook: boolean;
    timeline: boolean;
  }>({
    caption: false,
    hashtags: false,
    script: false,
    hook: false,
    timeline: false
  });
  const { rateLimitData, canUseAI, getAILimitMessage } = useAIRateLimit();
  const { showToast } = useToast();

  // Debug logs on every render
  console.log('🔍 ComposeLeftPanel render - canUseAI:', canUseAI(), 'rateLimitData:', rateLimitData, 'aiLoading:', aiLoading);

  const handleAIAction = async (action: 'caption' | 'hashtags' | 'script' | 'hook' | 'timeline') => {
    console.log('🚀 Starting AI action:', action, 'Current loading state:', aiLoading);
    
    // Check AI rate limit first
    if (!canUseAI()) {
      showToast({
        message: getAILimitMessage() || 'Bạn đã vượt quá giới hạn sử dụng AI. Vui lòng nâng cấp tài khoản.',
        type: 'warning',
        title: 'Giới hạn AI'
      });
      return;
    }

    // Set loading state for this action
    console.log('⏳ Setting loading state for action:', action);
    setAiLoading(prev => {
      const newState = { ...prev, [action]: true };
      console.log('📊 New loading state:', newState);
      return newState;
    });
    
    const startTime = Date.now();
    
    try {
      const platform = composeData.metadata?.platform?.toLowerCase().replace(' page', '') || 'facebook';
      const title = composeData.title || '';
      const content = composeData.content || '';
      
      // Build rich AI context
      const aiContext = buildAIContext(composeData);

      let endpoint = '';
      let requestBody: any = {};

      switch (action) {
        case 'caption':
          endpoint = '/api/ai/caption';
          requestBody = {
            platform,
            title,
            content,
            tone: 'exciting',
            aiContext // Pass rich context
          };
          break;

        case 'hashtags':
          endpoint = '/api/ai/hashtags';
          requestBody = {
            platform,
            title,
            content,
            aiContext, // Pass rich context
            count: 10
          };
          break;

        case 'script':
          endpoint = '/api/ai/script';
          requestBody = {
            platform,
            title,
            content,
            duration: composeData.metadata?.duration || 30,
            tone: 'engaging'
          };
          break;

        default:
          console.log(`AI action ${action} not implemented yet`);
          return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 429) {
          // Handle rate limit error with specific message
          const rateLimitMessage = errorData.message || 'Bạn đã hết số lần sử dụng AI. Vui lòng nâng cấp tài khoản hoặc thử lại sau.';
          showToast({
            message: rateLimitMessage,
            type: 'warning',
            title: 'Đã hết lượt sử dụng AI'
          });
          return;
        }
        
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const data = await response.json();

      // Update content based on AI response
      if (action === 'caption' && data.caption) {
        onDataChange({
          ...composeData,
          content: data.caption
        });
        showToast({
          message: 'Nội dung đã được tạo thành công bằng AI',
          type: 'success',
          title: 'Tạo nội dung thành công'
        });
      } else if (action === 'hashtags' && data.hashtags) {
        const hashtags = Array.isArray(data.hashtags) ? data.hashtags.join(' ') : data.hashtags;
        onDataChange({
          ...composeData,
          metadata: {
            platform: composeData.metadata?.platform || 'Facebook Page',
            ratio: composeData.metadata?.ratio || '1:1',
            ...composeData.metadata,
            hashtags
          }
        });
        showToast({
          message: 'Hashtags đã được tạo thành công bằng AI',
          type: 'success',
          title: 'Tạo hashtags thành công'
        });
      } else if (action === 'script' && data.script) {
        onDataChange({
          ...composeData,
          content: data.script
        });
        showToast({
          message: 'Script video đã được tạo thành công bằng AI',
          type: 'success',
          title: 'Tạo script thành công'
        });
      }

      // Log successful AI usage
      await activityLogger.logAIUsage(
        action, 
        platform, 
        true
      );

      // Reset loading state for successful action
      console.log('✅ AI action completed successfully, resetting loading state for:', action);
      setAiLoading(prev => {
        const newState = { ...prev, [action]: false };
        console.log('📊 Final loading state:', newState);
        return newState;
      });

    } catch (error) {
      console.error('AI action error:', error);
      
      // Log failed AI usage
      await activityLogger.logAIUsage(
        action, 
        composeData.metadata?.platform || 'facebook', 
        false, 
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo nội dung AI';
      showToast({
        message: errorMessage,
        type: 'error',
        title: 'Lỗi AI'
      });
    } finally {
      // Reset loading state for this action
      console.log('🔄 Finally block: resetting loading state for:', action);
      setAiLoading(prev => {
        const newState = { ...prev, [action]: false };
        console.log('📊 Final cleanup state:', newState);
        return newState;
      });
    }
  };

  const handleTemplateSelect = async (template: typeof templates[0] | typeof videoTemplates[0]) => {
    setSelectedTemplate(template.id);
    
    if (activeTab === 'video') {
      const videoTemplate = template as typeof videoTemplates[0];
      onDataChange({
        ...composeData,
        content: videoTemplate.content,
        metadata: {
          type: 'video',
          platform: composeData.metadata?.platform || 'Facebook Page',
          ratio: videoTemplate.ratio,
          duration: videoTemplate.duration,
          hook: videoTemplate.hook,
          beats: videoTemplate.beats,
          ...composeData.metadata,
          template: template.id,
        }
      });
    } else {
      const socialTemplate = template as typeof templates[0];
      onDataChange({
        ...composeData,
        content: socialTemplate.content,
        metadata: {
          type: 'social',
          platform: composeData.metadata?.platform || 'Facebook Page',
          ratio: socialTemplate.ratio,
          ...composeData.metadata,
          template: template.id,
        }
      });
    }

    // Log template usage
    await activityLogger.logTemplateUsed(template, activeTab);
    
    // Show success toast
    showToast({
      message: `Đã áp dụng template "${template.name}"`,
      type: 'success',
      title: 'Áp dụng template thành công'
    });
  };

  const handlePlatformChange = async (platform: string) => {
    const newData = {
      ...composeData,
      metadata: {
        ...composeData.metadata,
        platform,
        ratio: composeData.metadata?.ratio || '1:1',
      }
    };
    
    onDataChange(newData);

    // Log platform selection
    await activityLogger.logPlatformSelected(
      platform, 
      newData.metadata.ratio, 
      activeTab
    );
  };

  const handleRatioChange = async (ratio: string) => {
    const newData = {
      ...composeData,
      metadata: {
        ...composeData.metadata,
        platform: composeData.metadata?.platform || 'Facebook Page',
        ratio,
      }
    };
    
    onDataChange(newData);

    // Log platform/ratio selection
    await activityLogger.logPlatformSelected(
      newData.metadata.platform, 
      ratio, 
      activeTab
    );
  };

  const handleBrandColorChange = (color: string) => {
    onDataChange({
      ...composeData,
      metadata: {
        platform: composeData.metadata?.platform || 'Facebook Page',
        ratio: composeData.metadata?.ratio || '1:1',
        ...composeData.metadata,
        brandColor: color
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
      {/* Tab Selector */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onTabChange('social')}
          style={{
            backgroundColor: activeTab === 'social' ? '#dbeafe' : 'transparent',
            borderColor: activeTab === 'social' ? '#3b82f6' : 'transparent',
            color: activeTab === 'social' ? '#1e40af' : '#6b7280'
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors border-2 ${
            activeTab === 'social' ? 'shadow-sm' : 'hover:text-gray-900'
          }`}
        >
          📱 Bài Viết Mạng Xã Hội
          {activeTab === 'social' && (
            <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
          )}
        </button>
        <button
          onClick={() => onTabChange('video')}
          style={{
            backgroundColor: activeTab === 'video' ? '#fef3c7' : 'transparent',
            borderColor: activeTab === 'video' ? '#f59e0b' : 'transparent',
            color: activeTab === 'video' ? '#92400e' : '#6b7280'
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors border-2 ${
            activeTab === 'video' ? 'shadow-sm' : 'hover:text-gray-900'
          }`}
        >
          🎥 Video/Reel
          {activeTab === 'video' && (
            <span className="ml-2 w-2 h-2 bg-amber-500 rounded-full inline-block"></span>
          )}
        </button>
      </div>

      {/* Platform Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Nền tảng
          {composeData.metadata?.platform && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
              ✓ {composeData.metadata.platform}
            </span>
          )}
        </label>
        <div className="grid grid-cols-1 gap-2">
          {platforms.map((platform) => {
            const currentPlatform = composeData.metadata?.platform;
            const isSelected = currentPlatform === platform.label;
            const isDefaultSelected = !currentPlatform && platform.key === 'facebook';
            const shouldHighlight = isSelected || isDefaultSelected;
            
            return (
              <button
                key={platform.key}
                onClick={() => {
                  handlePlatformChange(platform.label);
                }}
                disabled={!platform.available}
                style={{
                  backgroundColor: shouldHighlight ? '#dbeafe' : 'white',
                  borderColor: shouldHighlight ? '#3b82f6' : '#d1d5db',
                  color: shouldHighlight ? '#1e40af' : '#374151'
                }}
                className={`p-3 rounded-lg border-2 text-left transition-colors flex items-center gap-3 cursor-pointer`}
              >
                <span className="text-lg">{platform.icon}</span>
                <div>
                  <div className="font-medium">{platform.label}</div>
                  {!platform.available && (
                    <div className="text-xs text-gray-400">Chưa khả dụng</div>
                  )}
                </div>
                {shouldHighlight && (
                  <div className="ml-auto">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tỉ lệ khung hình
          {composeData.metadata?.ratio && (
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
              ✓ {composeData.metadata.ratio}
            </span>
          )}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(activeTab === 'video' ? videoRatios : ratios).map((ratio) => {
            const currentRatio = composeData.metadata?.ratio;
            const isSelected = currentRatio === ratio.key;
            const isDefaultSelected = !currentRatio && ratio.key === (activeTab === 'video' ? '9:16' : '1:1');
            const shouldHighlight = isSelected || isDefaultSelected;
            
            return (
              <button
                key={ratio.key}
                onClick={() => {
                  handleRatioChange(ratio.key);
                }}
                style={{
                  backgroundColor: shouldHighlight ? '#dcfce7' : 'white',
                  borderColor: shouldHighlight ? '#16a34a' : '#d1d5db',
                  color: shouldHighlight ? '#15803d' : '#374151'
                }}
                className={`relative p-3 rounded-lg border-2 text-left transition-colors cursor-pointer`}
              >
                <div className="font-medium text-sm">{ratio.label}</div>
                <div className="text-xs mt-1 opacity-70">{ratio.description}</div>
                {shouldHighlight && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Duration Control - Only for Video tab */}
      {activeTab === 'video' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Thời lượng video
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[15, 30, 60].map((duration) => (
              <button
                key={duration}
                onClick={() => {
                  onDataChange({
                    ...composeData,
                    metadata: {
                      platform: composeData.metadata?.platform || 'Facebook Page',
                      ratio: composeData.metadata?.ratio || '9:16',
                      ...composeData.metadata,
                      duration
                    }
                  });
                }}
                className={`p-2 rounded-lg border text-center transition-colors ${
                  composeData.metadata?.duration === duration
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium">{duration}s</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Brand Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Màu thương hiệu
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={composeData.metadata?.brandColor || '#0ea5e9'}
            onChange={(e) => handleBrandColorChange(e.target.value)}
            className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
          />
          <div>
            <div className="text-sm font-medium">
              {composeData.metadata?.brandColor || '#0ea5e9'}
            </div>
            <div className="text-xs text-gray-500">
              Màu chủ đạo cho thiết kế
            </div>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {activeTab === 'video' ? 'Mẫu Video thiết kế sẵn' : 'Mẫu thiết kế sẵn'}
        </label>
        <div className="space-y-2">
          {(activeTab === 'video' ? videoTemplates : templates).map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                  {activeTab === 'video' && 'duration' in template && (
                    <div className="text-xs text-amber-600 mt-1">
                      ⏱️ {(template as any).duration}s • {(template as any).hook}
                    </div>
                  )}
                </div>
                <div className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                  {template.ratio}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* AI Tools */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">AI Assistant</h3>
          <div className="text-xs text-gray-500">
            {getAILimitMessage()}
          </div>
        </div>
        
        {!canUseAI() && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-800">
              <span className="font-medium">🔒 AI không khả dụng</span>
              <div className="text-xs mt-1">
                {rateLimitData?.stats.userRole === 'free' 
                  ? 'Nâng cấp lên Professional để sử dụng AI'
                  : 'Bạn đã vượt quá giới hạn sử dụng AI hôm nay'
                }
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          {activeTab === 'video' ? (
            <>
              <button 
                onClick={() => handleAIAction('script')}
                disabled={!canUseAI() || aiLoading.script}
                className={`w-full p-3 border rounded-lg text-left transition-colors ${
                  canUseAI() && !aiLoading.script
                    ? 'border-gray-200 hover:bg-gray-50 cursor-pointer' 
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                }`}>
                <div className="flex items-center gap-2">
                  <span>
                    {aiLoading.script ? (
                      <div className="animate-spin text-blue-500">⏳</div>
                    ) : canUseAI() ? (
                      '🎬'
                    ) : (
                      '🔒'
                    )}
                  </span>
                  <div>
                    <div className="text-sm font-medium">
                      {aiLoading.script ? 'Đang tạo script...' : 'Tạo script video'}
                    </div>
                    <div className="text-xs text-gray-500">AI viết kịch bản video</div>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => handleAIAction('hook')}
                disabled={!canUseAI() || aiLoading.hook}
                className={`w-full p-3 border rounded-lg text-left transition-colors ${
                  canUseAI() && !aiLoading.hook
                    ? 'border-gray-200 hover:bg-gray-50 cursor-pointer' 
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                }`}>
                <div className="flex items-center gap-2">
                  <span>
                    {aiLoading.hook ? (
                      <div className="animate-spin text-blue-500">⏳</div>
                    ) : canUseAI() ? (
                      '🎯'
                    ) : (
                      '🔒'
                    )}
                  </span>
                  <div>
                    <div className="text-sm font-medium">
                      {aiLoading.hook ? 'Đang tạo hook...' : 'Gợi ý hook'}
                    </div>
                    <div className="text-xs text-gray-500">Câu mở đầu thu hút</div>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => handleAIAction('timeline')}
                disabled={!canUseAI() || aiLoading.timeline}
                className={`w-full p-3 border rounded-lg text-left transition-colors ${
                  canUseAI() && !aiLoading.timeline
                    ? 'border-gray-200 hover:bg-gray-50 cursor-pointer' 
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                }`}>
                <div className="flex items-center gap-2">
                  <span>
                    {aiLoading.timeline ? (
                      <div className="animate-spin text-blue-500">⏳</div>
                    ) : canUseAI() ? (
                      '⏱️'
                    ) : (
                      '🔒'
                    )}
                  </span>
                  <div>
                    <div className="text-sm font-medium">
                      {aiLoading.timeline ? 'Đang chia timeline...' : 'Chia timeline'}
                    </div>
                    <div className="text-xs text-gray-500">Phân chia thời gian video</div>
                  </div>
                </div>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => {
                  console.log('🔥 BUTTON CLICKED!!! - AI Caption button');
                  console.log('🎯 AI Caption button clicked, current loading state:', aiLoading.caption);
                  console.log('📊 Can use AI:', canUseAI());
                  console.log('🔍 AI rate limit data:', rateLimitData);
                  handleAIAction('caption');
                }}
                disabled={!canUseAI() || aiLoading.caption}
                className={`w-full p-3 border rounded-lg text-left transition-colors ${
                  canUseAI() && !aiLoading.caption
                    ? 'border-gray-200 hover:bg-gray-50 cursor-pointer' 
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                }`}>
                <div className="flex items-center gap-2">
                  <span>
                    {aiLoading.caption ? (
                      <div className="animate-spin text-blue-500">⏳</div>
                    ) : canUseAI() ? (
                      '🤖'
                    ) : (
                      '🔒'
                    )}
                  </span>
                  <div>
                    <div className="text-sm font-medium">
                      {aiLoading.caption ? 'Đang tạo nội dung...' : 'Tạo nội dung'}
                    </div>
                    <div className="text-xs text-gray-500">AI viết caption</div>
                  </div>
                  {/* Debug display */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="ml-auto text-xs text-red-500">
                      {aiLoading.caption ? 'LOADING' : 'READY'}
                    </div>
                  )}
                </div>
              </button>
              
              <button 
                onClick={() => handleAIAction('hashtags')}
                disabled={!canUseAI() || aiLoading.hashtags}
                className={`w-full p-3 border rounded-lg text-left transition-colors ${
                  canUseAI() && !aiLoading.hashtags
                    ? 'border-gray-200 hover:bg-gray-50 cursor-pointer' 
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                }`}>
                <div className="flex items-center gap-2">
                  <span>
                    {aiLoading.hashtags ? (
                      <div className="animate-spin text-blue-500">⏳</div>
                    ) : canUseAI() ? (
                      '#️⃣'
                    ) : (
                      '🔒'
                    )}
                  </span>
                  <div>
                    <div className="text-sm font-medium">
                      {aiLoading.hashtags ? 'Đang tạo hashtags...' : 'Gợi ý hashtag'}
                    </div>
                    <div className="text-xs text-gray-500">Auto hashtags</div>
                  </div>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

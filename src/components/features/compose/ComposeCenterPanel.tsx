'use client';

import { useState } from 'react';
import ImageUpload from '@/components/ui/ImageUpload';

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

interface UploadedImage {
  id: string;
  file: File;
  publicUrl: string;
  path: string;
  uploading: boolean;
  error?: string;
}

interface ComposeCenterPanelProps {
  activeTab: 'social' | 'video';
  composeData: Partial<ComposeData>;
  onDataChange: (data: Partial<ComposeData>) => void;
  showToast?: (options: { message: string; type: 'success' | 'error' | 'warning'; title?: string }) => void;
}

export default function ComposeCenterPanel({
  activeTab,
  composeData,
  onDataChange,
  showToast
}: ComposeCenterPanelProps) {
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  
  // AI Loading states
  const [aiLoading, setAiLoading] = useState({
    content: false,
    hashtags: false
  });

  const handleTitleChange = (title: string) => {
    onDataChange({
      ...composeData,
      title
    });
  };

  const handleContentChange = (content: string) => {
    onDataChange({
      ...composeData,
      content
    });
  };

  const handleHashtagsChange = (hashtags: string) => {
    onDataChange({
      ...composeData,
      metadata: {
        platform: composeData.metadata?.platform || 'Facebook Page',
        ratio: composeData.metadata?.ratio || '1:1',
        ...composeData.metadata,
        hashtags
      }
    });
  };

  const handleCTAChange = (cta: string) => {
    onDataChange({
      ...composeData,
      metadata: {
        platform: composeData.metadata?.platform || 'Facebook Page',
        ratio: composeData.metadata?.ratio || '1:1',
        ...composeData.metadata,
        cta
      }
    });
  };

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
    const mediaUrls = images
      .filter(img => !img.uploading && !img.error && img.publicUrl)
      .map(img => img.publicUrl);
    
    onDataChange({
      ...composeData,
      mediaUrls
    });
  };

  // Generate AI content
  const handleGenerateContent = async () => {
    console.log('🚀 AI Content generation started');
    setAiLoading(prev => ({ ...prev, content: true }));
    
    try {
      const response = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: (composeData.metadata?.platform || 'Facebook Page').toLowerCase().replace(' page', ''),
          title: composeData.title || '',
          content: composeData.content || '',
          tone: 'exciting',
          targetAudience: 'general'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 429) {
          showToast?.({
            message: errorData.message || 'Bạn đã hết số lần sử dụng AI để tạo nội dung. Vui lòng nâng cấp tài khoản hoặc thử lại sau.',
            type: 'warning',
            title: 'Đã hết lượt tạo nội dung AI'
          });
        } else {
          showToast?.({
            message: errorData.error || 'Có lỗi xảy ra khi tạo nội dung AI',
            type: 'error',
            title: 'Lỗi tạo nội dung'
          });
        }
        return;
      }

      const data = await response.json();
      if (data.caption) {
        handleContentChange(data.caption);
        showToast?.({
          message: 'Nội dung đã được tạo thành công bằng AI',
          type: 'success',
          title: 'Tạo nội dung thành công'
        });
      }
    } catch (error) {
      console.error('Error generating content:', error);
      showToast?.({
        message: 'Có lỗi xảy ra khi tạo nội dung AI',
        type: 'error',
        title: 'Lỗi tạo nội dung'
      });
    } finally {
      console.log('🔄 AI Content generation finished');
      setAiLoading(prev => ({ ...prev, content: false }));
    }
  };

  // Generate hashtags
  const handleGenerateHashtags = async () => {
    console.log('🚀 AI Hashtags generation started');
    setAiLoading(prev => ({ ...prev, hashtags: true }));
    
    try {
      const response = await fetch('/api/ai/hashtags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: (composeData.metadata?.platform || 'Facebook Page').toLowerCase().replace(' page', ''),
          title: composeData.title || '',
          content: composeData.content || '',
          count: 8
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 429) {
          showToast?.({
            message: errorData.message || 'Bạn đã hết số lần sử dụng AI để tạo hashtags. Vui lòng nâng cấp tài khoản hoặc thử lại sau.',
            type: 'warning',
            title: 'Đã hết lượt tạo hashtags AI'
          });
        } else {
          showToast?.({
            message: errorData.error || 'Có lỗi xảy ra khi tạo hashtags AI',
            type: 'error',
            title: 'Lỗi tạo hashtags'
          });
        }
        return;
      }

      const data = await response.json();
      if (data.hashtags) {
        const hashtags = Array.isArray(data.hashtags) ? data.hashtags.join(' ') : data.hashtags;
        handleHashtagsChange(hashtags);
        showToast?.({
          message: 'Hashtags đã được tạo thành công bằng AI',
          type: 'success',
          title: 'Tạo hashtags thành công'
        });
      }
    } catch (error) {
      console.error('Error generating hashtags:', error);
      showToast?.({
        message: 'Có lỗi xảy ra khi tạo hashtags AI',
        type: 'error',
        title: 'Lỗi tạo hashtags'
      });
    } finally {
      console.log('🔄 AI Hashtags generation finished');
      setAiLoading(prev => ({ ...prev, hashtags: false }));
    }
  };

  const getPreviewDimensions = () => {
    const ratio = composeData.metadata?.ratio || '1:1';
    const device = previewDevice;
    
    let baseWidth = 300;
    if (device === 'tablet') baseWidth = 400;
    if (device === 'desktop') baseWidth = 500;
    
    switch (ratio) {
      case '1:1':
        return { width: baseWidth, height: baseWidth };
      case '4:5':
        return { width: baseWidth, height: baseWidth * 1.25 };
      case '9:16':
        return { width: baseWidth * 0.6, height: baseWidth * 1.07 };
      case '16:9':
        return { width: baseWidth, height: baseWidth * 0.56 };
      default:
        return { width: baseWidth, height: baseWidth };
    }
  };

  const dimensions = getPreviewDimensions();

  return (
    <div className="space-y-6">
      {/* Content Editor */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Nội dung bài viết
        </h2>
        
        <div className="space-y-4">
          {/* Title/Hook */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề / Hook
            </label>
            <input
              type="text"
              value={composeData.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Nhập tiêu đề thu hút..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Nội dung chính
              </label>
              <button
                onClick={() => {
                  console.log('🎯 AI Content button clicked, loading state:', aiLoading.content);
                  handleGenerateContent();
                }}
                disabled={aiLoading.content}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                  aiLoading.content 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                {aiLoading.content ? (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                ) : (
                  '🤖'
                )}
                {aiLoading.content ? 'Đang tạo...' : 'AI tạo nội dung'}
              </button>
            </div>
            <textarea
              value={composeData.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Viết nội dung bài đăng..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Hashtags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Hashtags
              </label>
              <button
                onClick={() => {
                  console.log('🎯 AI Hashtags button clicked, loading state:', aiLoading.hashtags);
                  handleGenerateHashtags();
                }}
                disabled={aiLoading.hashtags}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                  aiLoading.hashtags 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                {aiLoading.hashtags ? (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                ) : (
                  '#️⃣'
                )}
                {aiLoading.hashtags ? 'Đang tạo...' : 'AI gợi ý hashtag'}
              </button>
            </div>
            <input
              type="text"
              value={composeData.metadata?.hashtags || ''}
              onChange={(e) => handleHashtagsChange(e.target.value)}
              placeholder="#hashtag #trend #viral"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* CTA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call to Action
            </label>
            <input
              type="text"
              value={composeData.metadata?.cta || ''}
              onChange={(e) => handleCTAChange(e.target.value)}
              placeholder="Mua ngay, Tìm hiểu thêm, Đăng ký..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh
            </label>
            <ImageUpload
              userId="compose-user"
              maxImages={4}
              onImagesChange={handleImagesChange}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeTab === 'video' ? 'Xem trước Video' : 'Xem trước'}
          </h2>
          
          {/* Device Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: 'mobile', label: '📱', tooltip: 'Mobile' },
              { key: 'tablet', label: '📱', tooltip: 'Tablet' },
              { key: 'desktop', label: '💻', tooltip: 'Desktop' }
            ].map((device) => (
              <button
                key={device.key}
                onClick={() => setPreviewDevice(device.key as any)}
                title={device.tooltip}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  previewDevice === device.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {device.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Container */}
        <div className="flex justify-center">
          <div 
            className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4 overflow-hidden"
            style={{ 
              width: dimensions.width + 32, 
              height: dimensions.height + 32 
            }}
          >
            <div
              className="bg-white rounded-lg shadow-sm overflow-hidden relative"
              style={{ 
                width: dimensions.width, 
                height: dimensions.height,
                background: composeData.metadata?.brandColor || '#0ea5e9'
              }}
            >
              {activeTab === 'video' ? (
                /* Video Preview */
                <div className="h-full flex flex-col justify-between p-4 text-white relative">
                  {/* Video Duration Badge */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-60 rounded px-2 py-1 text-xs">
                    {composeData.metadata?.duration || 30}s
                  </div>
                  
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-8 border-l-white border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
                    </div>
                  </div>
                  
                  {/* Video Hook/Title */}
                  {(composeData.metadata?.hook || composeData.title) && (
                    <div className="relative z-10">
                      <div className="font-bold text-lg mb-2 line-clamp-2">
                        {composeData.metadata?.hook || composeData.title}
                      </div>
                    </div>
                  )}
                  
                  {/* Video Content/Script */}
                  {composeData.content && (
                    <div className="relative z-10 flex-1 flex items-center">
                      <div className="text-sm opacity-90 line-clamp-3 bg-black bg-opacity-30 rounded p-2">
                        {composeData.content.split('\n').slice(0, 2).join(' ')}
                      </div>
                    </div>
                  )}
                  
                  {/* Video Timeline Beats */}
                  {composeData.metadata?.beats && composeData.metadata.beats.length > 0 && (
                    <div className="relative z-10 mt-auto">
                      <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded p-2">
                        <div className="text-xs mb-1 opacity-75">Timeline:</div>
                        <div className="space-y-1">
                          {composeData.metadata.beats.slice(0, 3).map((beat, index) => (
                            <div key={index} className="text-xs opacity-90 flex">
                              <span className="w-8 text-amber-300">{beat.time}s</span>
                              <span className="flex-1">{beat.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Platform Icon for Video */}
                  <div className="absolute bottom-2 right-2 text-xs opacity-75">
                    {composeData.metadata?.platform?.includes('Instagram') ? '📷' : 
                     composeData.metadata?.platform?.includes('Facebook') ? '📘' : 
                     composeData.metadata?.platform?.includes('TikTok') ? '🎵' : '🎬'}
                  </div>
                </div>
              ) : (
                /* Social Post Preview */
                <div className="h-full flex flex-col justify-between p-4 text-white">
                  {/* Title */}
                  {composeData.title && (
                    <div className="font-bold text-lg mb-2 line-clamp-2">
                      {composeData.title}
                    </div>
                  )}
                  
                  {/* Content */}
                  {composeData.content && (
                    <div className="flex-1 text-sm opacity-90 line-clamp-4">
                      {composeData.content.split('\n').slice(0, 3).join(' ')}
                    </div>
                  )}
                  
                  {/* CTA Button */}
                  {composeData.metadata?.cta && (
                    <div className="mt-auto">
                      <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2 text-center font-medium">
                        {composeData.metadata.cta}
                      </div>
                    </div>
                  )}
                  
                  {/* Hashtags */}
                  {composeData.metadata?.hashtags && (
                    <div className="mt-2 text-xs opacity-75">
                      {composeData.metadata.hashtags}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Info */}
        <div className="mt-4 text-center text-sm text-gray-500">
          {composeData.metadata?.platform || 'Facebook Page'} • {composeData.metadata?.ratio || (activeTab === 'video' ? '9:16' : '1:1')} • {previewDevice}
          {activeTab === 'video' && composeData.metadata?.duration && (
            <span> • {composeData.metadata.duration}s</span>
          )}
        </div>
      </div>
    </div>
  );
}

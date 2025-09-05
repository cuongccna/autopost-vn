'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGate from '@/components/shared/PermissionGate';
import { FileText, Copy, Heart, Crown, Lock } from 'lucide-react';

interface ContentTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  hashtags: string;
  category: string;
  isPremium: boolean;
  platform: string[];
  likes: number;
}

interface TemplateGalleryProps {
  onSelectTemplate: (template: ContentTemplate) => void;
  selectedPlatforms?: string[];
}

export default function TemplateGallery({ onSelectTemplate, selectedPlatforms = [] }: TemplateGalleryProps) {
  const { userRole, hasFeature, getLimit } = usePermissions();
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const freeTemplateLimit = getLimit('templates', 'basicCount');
  const canAccessPremium = hasFeature('templates', 'customTemplates');

  useEffect(() => {
    // Mock templates data - replace with actual API call
    const mockTemplates: ContentTemplate[] = [
      {
        id: '1',
        title: 'Sale cuối tuần',
        description: 'Template cho khuyến mãi cuối tuần',
        content: '🔥 SALE CUỐI TUẦN - GIẢM ĐẾN 50%\n\nChỉ còn 2 ngày cuối để săn deal HOT! \n\n✨ Miễn phí ship toàn quốc\n⚡ Thanh toán COD an toàn\n🎁 Quà tặng kèm hấp dẫn',
        hashtags: '#sale #cuoituan #giam50 #freeship #deal',
        category: 'promotion',
        isPremium: false,
        platform: ['facebook', 'instagram'],
        likes: 1250,
      },
      {
        id: '2',
        title: 'Giới thiệu sản phẩm mới',
        description: 'Template ra mắt sản phẩm',
        content: '🌟 RA MẮT SẢN PHẨM MỚI\n\nChúng tôi tự hào giới thiệu [TÊN SẢN PHẨM] - giải pháp hoàn hảo cho [VẤN ĐỀ].\n\n💡 Tính năng nổi bật:\n• [Tính năng 1]\n• [Tính năng 2]\n• [Tính năng 3]\n\n📞 Liên hệ ngay để được tư vấn!',
        hashtags: '#sanphammoi #ramact #tinhnang #tuvan',
        category: 'product',
        isPremium: false,
        platform: ['facebook', 'zalo'],
        likes: 890,
      },
      {
        id: '3',
        title: 'Cảm ơn khách hàng',
        description: 'Template cảm ơn và review',
        content: '💕 CẢM ƠN QUÝ KHÁCH HÀNG\n\nChúng tôi xin chân thành cảm ơn sự tin tưởng và ủng hộ của quý khách trong thời gian qua.\n\n🌟 Feedback từ khách hàng là động lực để chúng tôi không ngừng cải thiện chất lượng dịch vụ.\n\n❤️ Hãy để lại review để giúp chúng tôi phục vụ bạn tốt hơn nhé!',
        hashtags: '#camong #khachhang #review #chatluong #dichvu',
        category: 'customer',
        isPremium: false,
        platform: ['facebook', 'zalo'],
        likes: 2100,
      },
      // Premium templates
      {
        id: '4',
        title: 'Video script TikTok viral',
        description: 'Script cho video TikTok xu hướng',
        content: '🎬 SCRIPT TIKTOK VIRAL\n\nHook (3s đầu): "Bạn có biết cách làm [X] chỉ trong 30 giây?"\n\nProblem (5-10s): Trình bày vấn đề phổ biến\n\nSolution (15-20s): Hướng dẫn step-by-step\n\nCall-to-action: "Follow để xem thêm tips hay nhé!"\n\n💡 Nhớ sử dụng trending sound và hashtag hot!',
        hashtags: '#viral #tiktok #script #trending #tips #fyp',
        category: 'video',
        isPremium: true,
        platform: ['tiktok'],
        likes: 5600,
      },
      {
        id: '5',
        title: 'Email marketing chuyên nghiệp',
        description: 'Template email marketing hiệu quả',
        content: '📧 EMAIL MARKETING TEMPLATE\n\nSubject: [URGENT] Ưu đãi đặc biệt chỉ dành cho bạn!\n\nXin chào [TÊN KHÁCH HÀNG],\n\nChúng tôi có tin tuyệt vời! Bạn đã được chọn để nhận ưu đãi đặc biệt:\n\n🎯 Giảm 30% cho đơn hàng tiếp theo\n⏰ Có hiệu lực đến [NGÀY]\n🔗 Mã giảm giá: [MÃ]\n\nKhông bỏ lỡ cơ hội này!\n\n[BUTTON CTA]',
        hashtags: '#email #marketing #uudai #giam30 #khachhang',
        category: 'email',
        isPremium: true,
        platform: ['email'],
        likes: 3400,
      },
      {
        id: '6',
        title: 'Content series 7 ngày',
        description: 'Kế hoạch content 1 tuần hoàn chỉnh',
        content: '📅 CONTENT SERIES 7 NGÀY\n\nThứ 2: Monday Motivation - Động lực đầu tuần\nThứ 3: Tips Tuesday - Chia sẻ mẹo hay\nThứ 4: Wisdom Wednesday - Kiến thức chuyên sâu\nThứ 5: Throwback Thursday - Nhìn lại hành trình\nThứ 6: Fun Friday - Nội dung giải trí\nThứ 7: Saturday Spotlight - Nổi bật sản phẩm\nChủ nhật: Sunday Stories - Câu chuyện thương hiệu\n\n🎯 Mỗi ngày một chủ đề, giữ audience luôn engaged!',
        hashtags: '#contentplan #7ngay #motivation #tips #content',
        category: 'strategy',
        isPremium: true,
        platform: ['facebook', 'instagram', 'zalo'],
        likes: 4200,
      },
    ];

    setTemplates(mockTemplates);
    setLoading(false);
  }, []);

  const categories = [
    { id: 'all', label: 'Tất cả', count: templates.length },
    { id: 'promotion', label: 'Khuyến mãi', count: templates.filter(t => t.category === 'promotion').length },
    { id: 'product', label: 'Sản phẩm', count: templates.filter(t => t.category === 'product').length },
    { id: 'customer', label: 'Khách hàng', count: templates.filter(t => t.category === 'customer').length },
    { id: 'video', label: 'Video', count: templates.filter(t => t.category === 'video').length },
    { id: 'email', label: 'Email', count: templates.filter(t => t.category === 'email').length },
    { id: 'strategy', label: 'Chiến lược', count: templates.filter(t => t.category === 'strategy').length },
  ];

  const filteredTemplates = templates.filter(template => {
    const categoryMatch = selectedCategory === 'all' || template.category === selectedCategory;
    const platformMatch = selectedPlatforms.length === 0 || 
      template.platform.some(p => selectedPlatforms.includes(p));
    return categoryMatch && platformMatch;
  });

  const freeTemplates = filteredTemplates.filter(t => !t.isPremium);
  const premiumTemplates = filteredTemplates.filter(t => t.isPremium);

  const availableFreeTemplates = freeTemplateLimit === -1 ? freeTemplates : freeTemplates.slice(0, freeTemplateLimit);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Đang tải templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Template Gallery</h2>
        </div>
        <div className="text-sm text-gray-600">
          {userRole === 'free' && freeTemplateLimit > 0 && (
            <span>Miễn phí: {availableFreeTemplates.length}/{freeTemplateLimit} templates</span>
          )}
          {canAccessPremium && (
            <span className="ml-2 text-blue-600">+ {premiumTemplates.length} Premium</span>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.label} ({category.count})
          </button>
        ))}
      </div>

      {/* Free Templates */}
      {availableFreeTemplates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            Templates miễn phí
            <span className="text-sm text-gray-500">({availableFreeTemplates.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableFreeTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={onSelectTemplate}
                isAccessible={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Free templates limit warning */}
      {userRole === 'free' && freeTemplateLimit > 0 && freeTemplates.length > freeTemplateLimit && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-orange-800">
              Còn {freeTemplates.length - freeTemplateLimit} templates miễn phí bị khóa
            </span>
          </div>
          <p className="text-sm text-orange-700 mb-3">
            Nâng cấp lên Professional để truy cập không giới hạn tất cả templates
          </p>
          <button className="bg-orange-600 text-white text-sm py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors">
            Nâng cấp ngay - 299k/tháng
          </button>
        </div>
      )}

      {/* Premium Templates */}
      {premiumTemplates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            Templates Premium
            <span className="text-sm text-gray-500">({premiumTemplates.length})</span>
          </h3>
          
          <PermissionGate
            feature="templates"
            subFeature="customTemplates"
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {premiumTemplates.slice(0, 3).map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => {}}
                    isAccessible={false}
                  />
                ))}
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {premiumTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={onSelectTemplate}
                  isAccessible={true}
                />
              ))}
            </div>
          </PermissionGate>
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: ContentTemplate;
  onSelect: (template: ContentTemplate) => void;
  isAccessible: boolean;
}

function TemplateCard({ template, onSelect, isAccessible }: TemplateCardProps) {
  const handleSelect = () => {
    if (isAccessible) {
      onSelect(template);
    }
  };

  return (
    <div className={`bg-white border rounded-xl p-4 transition-all duration-200 ${
      isAccessible 
        ? 'hover:shadow-md hover:border-blue-200 cursor-pointer' 
        : 'opacity-60 cursor-not-allowed'
    }`} onClick={handleSelect}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
            {template.title}
            {template.isPremium && <Crown className="w-4 h-4 text-yellow-600" />}
            {!isAccessible && <Lock className="w-4 h-4 text-gray-400" />}
          </h4>
          <p className="text-sm text-gray-600">{template.description}</p>
        </div>
      </div>

      {/* Content Preview */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <p className="text-sm text-gray-700 line-clamp-3">
          {template.content.substring(0, 100)}...
        </p>
      </div>

      {/* Hashtags */}
      <div className="mb-3">
        <p className="text-xs text-blue-600 line-clamp-1">{template.hashtags}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-600">{template.likes}</span>
          </div>
          <div className="flex gap-1">
            {template.platform.map(platform => (
              <span
                key={platform}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
        
        {isAccessible ? (
          <Copy className="w-4 h-4 text-gray-400" />
        ) : (
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Premium
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGate from '@/components/shared/PermissionGate';
import { useToast } from '@/components/ui/Toast';
import { usePostRateLimit } from '@/hooks/usePostRateLimit';
import { PROVIDERS } from '@/lib/constants';
import ImageUpload from '@/components/ui/ImageUpload';
import {
  Type as TypeIcon,
  Image as ImageIcon,
  Palette,
  Layers,
  Smartphone,
  Monitor,
  Tablet,
  Calendar,
  Sparkles,
  Hash,
  Settings2,
  SquareStack,
  Rows3,
  Wand2,
  X,
  Clock,
  Plus,
  Video,
  Target,
} from "lucide-react";

// --- UI Components ---
const Button = ({ children, onClick, variant = "primary", className = "", type = "button", disabled = false }: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: string;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-2 rounded-2xl text-sm font-medium shadow-sm transition hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
      variant === "primary"
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : variant === "outline"
        ? "border border-gray-300 text-gray-800 hover:bg-gray-50"
        : variant === "ghost"
        ? "text-gray-600 hover:bg-gray-100"
        : "bg-gray-200"
    } ${className}`}
  >
    {children}
  </button>
);

const Field = ({ label, hint, children, required }: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label className="block">
    <div className="flex items-center gap-2 mb-1">
      <span className="text-sm font-medium text-gray-800">{label}</span>
      {required ? <span className="text-red-500 text-xs">*</span> : null}
    </div>
    {children}
    {hint ? <p className="text-xs text-gray-500 mt-1 leading-snug">{hint}</p> : null}
  </label>
);

const Toggle = ({ checked, onChange, label }: {
  checked: boolean;
  onChange: (_checked: boolean) => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs border transition ${
      checked ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-300 text-gray-700"
    }`}
  >
    <span className={`inline-block w-2 h-2 rounded-full ${checked ? "bg-emerald-500" : "bg-gray-300"}`} />
    {label}
  </button>
);

const ToolbarButton = ({ icon: Icon, label, active, onClick }: {
  icon: any;
  label: string;
  active: boolean;
  onClick: (e?: React.MouseEvent) => void;
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(e);
  };
  
  return (
    <button
      type="button"
      onClick={handleClick}
      title={label}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition ${
        active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
      }`}
      style={{ pointerEvents: 'auto', zIndex: 10 }}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

// --- Helpers ---
const RATIOS = ["1:1", "4:5", "9:16", "16:9"];
const aspectDims = (ratio: string) => {
  switch (ratio) {
    case "1:1":
      return { w: 320, h: 320 };
    case "4:5":
      return { w: 320, h: 400 };
    case "9:16":
      return { w: 300, h: 533 };
    case "16:9":
      return { w: 480, h: 270 };
    default:
      return { w: 320, h: 320 };
  }
};

// Get responsive preview dimensions based on device
const getResponsiveDims = (ratio: string, device: 'mobile' | 'tablet' | 'desktop') => {
  const baseDims = aspectDims(ratio);
  
  // Maximum container constraints
  const maxWidth = device === 'desktop' ? 500 : device === 'tablet' ? 400 : 320;
  const maxHeight = 600; // Maximum height for any device
  
  let scaledDims;
  switch (device) {
    case 'mobile':
      scaledDims = { w: baseDims.w * 0.8, h: baseDims.h * 0.8 };
      break;
    case 'tablet':
      scaledDims = { w: baseDims.w * 1.0, h: baseDims.h * 1.0 };
      break;
    case 'desktop':
      scaledDims = { w: baseDims.w * 1.2, h: baseDims.h * 1.2 };
      break;
    default:
      scaledDims = baseDims;
  }
  
  // Apply constraints - scale down if exceeds limits
  if (scaledDims.w > maxWidth || scaledDims.h > maxHeight) {
    const scaleW = maxWidth / scaledDims.w;
    const scaleH = maxHeight / scaledDims.h;
    const finalScale = Math.min(scaleW, scaleH);
    
    scaledDims.w = scaledDims.w * finalScale;
    scaledDims.h = scaledDims.h * finalScale;
  }
  
  return scaledDims;
};

const TemplateCard = ({ tpl, selected, onSelect }: {
  tpl: any;
  selected: boolean;
  onSelect: (_template: any) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(tpl)}
    className={`group relative rounded-2xl border overflow-hidden text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      selected ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-200"
    }`}
  >
    <div className="bg-gradient-to-br from-gray-50 to-white p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-gray-800">{tpl.name}</div>
        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-white text-gray-600">{tpl.ratio}</span>
      </div>
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-2">
        <div className="h-20 w-full rounded-lg bg-gray-100 grid place-items-center text-gray-400 text-xs">Preview</div>
      </div>
    </div>
  </button>
);

// --- Enhanced Compose Modal ---
interface Post {
  id: string;
  title: string;
  datetime: string;
  providers: string[];
  status: 'scheduled' | 'published' | 'failed';
  content?: string;
  error?: string;
  mediaUrls?: string[];
}

interface UploadedImage {
  id: string;
  file: File;
  publicUrl: string;
  path: string;
  uploading: boolean;
  error?: string;
}

interface EnhancedComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (_data: {
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
  }) => void;
  goldenHours?: string[];
  defaultDateTime?: Date | null;
  editingPost?: Post | null;
  onAIUsageUpdate?: () => void; // New callback to refresh AI stats
  onActivityLogsUpdate?: () => void; // New callback to refresh activity logs
}

export default function EnhancedComposeModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  goldenHours: customGoldenHours, 
  defaultDateTime, 
  editingPost,
  onAIUsageUpdate,
  onActivityLogsUpdate
}: EnhancedComposeModalProps) {
  const { data: session } = useSession();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("social");
  
  // AI Usage state
  const [aiUsageStats, setAiUsageStats] = useState<{
    dailyUsage: number;
    dailyLimit: number;
    monthlyUsage: number;
    monthlyLimit: number;
    userRole: string;
    allowed: boolean;
  } | null>(null);
  
  // Social Post Form states
  const [platform, setPlatform] = useState("Facebook Page");
  const [ratio, setRatio] = useState("1:1");
  const [title, setTitle] = useState("");
  const [primaryText, setPrimaryText] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [cta, setCta] = useState("Mua ngay");
  const [gridOn, setGridOn] = useState(false);
  const [safeAreaOn, setSafeAreaOn] = useState(true);
  const [brandColor, setBrandColor] = useState("#0ea5e9");
  const [template, setTemplate] = useState<{id: string; name: string; description?: string; ratio?: string} | null>(null);
  
  // Video Form states
  const [videoPlatform, setVideoPlatform] = useState("Instagram Reels");
  const [videoRatio, setVideoRatio] = useState("9:16");
  const [duration, setDuration] = useState(15);
  const [hook, setHook] = useState("");
  const [beats, setBeats] = useState([
    { time: 0, text: "Hook - Câu mở đầu thu hút" },
    { time: 5, text: "Value - Giá trị cốt lõi" },
    { time: 12, text: "CTA - Kêu gọi hành động" },
  ]);
  const [sub, setSub] = useState("");
  const [overlayCTA, setOverlayCTA] = useState("Xem ngay");
  
  // Common states
  const [scheduleAt, setScheduleAt] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set(['facebook', 'instagram']));
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [initialEditImages, setInitialEditImages] = useState<UploadedImage[]>([]); // Store initial images for edit mode
  const [previewImages, setPreviewImages] = useState<string[]>([]); // For design preview
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Toast for notifications
  const { showToast } = useToast();

  // Post rate limit hook
  const postRateLimitHook = usePostRateLimit();
  
  // Emergency fix: Override in development mode
  const { 
    rateLimitData, 
    checkRateLimit, 
    canCreatePost, 
    getBlockedReason, 
    getRateLimitMessage 
  } = process.env.NODE_ENV === 'development' 
    ? {
        rateLimitData: {
          allowed: true,
          stats: {
            monthlyUsage: 0,
            monthlyLimit: 10000,
            weeklyUsage: 0,
            dailyUsage: 0,
            userRole: 'professional',
            allowed: true
          },
          userRole: 'professional'
        },
        checkRateLimit: () => Promise.resolve({ allowed: true }),
        canCreatePost: () => true,
        getBlockedReason: () => null,
        getRateLimitMessage: () => null
      }
    : postRateLimitHook;

  // Fetch AI usage stats on modal open
  const fetchAIUsageStats = async () => {
    try {
      const response = await fetch('/api/ai/usage-stats');
      if (response.ok) {
        const data = await response.json();
        setAiUsageStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching AI usage stats:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAIUsageStats();
      // Check rate limit when modal opens
      checkRateLimit();
    }
  }, [isOpen]);

  // AI Limit Warning Component
  const AILimitWarning = () => {
    if (!aiUsageStats) return null;
    
    const isAtLimit = aiUsageStats.dailyUsage >= aiUsageStats.dailyLimit && aiUsageStats.dailyLimit !== -1;
    const isNearLimit = aiUsageStats.dailyUsage / aiUsageStats.dailyLimit >= 0.8 && aiUsageStats.dailyLimit !== -1;
    
    if (!isAtLimit && !isNearLimit) return null;
    
    return (
      <div className={`mb-4 p-4 rounded-xl border-l-4 ${
        isAtLimit 
          ? 'bg-red-50 border-red-400 text-red-800' 
          : 'bg-orange-50 border-orange-400 text-orange-800'
      }`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isAtLimit ? '🚫' : '⚠️'}
          </div>
          <div className="flex-1">
            <h4 className="font-medium mb-1">
              {isAtLimit ? 'Đã hết lượt AI hôm nay' : 'Sắp hết lượt AI'}
            </h4>
            <p className="text-sm">
              {isAtLimit 
                ? `Bạn đã sử dụng ${aiUsageStats.dailyUsage}/${aiUsageStats.dailyLimit} lượt AI hôm nay.` 
                : `Bạn đã sử dụng ${aiUsageStats.dailyUsage}/${aiUsageStats.dailyLimit} lượt AI hôm nay.`
              }
            </p>
            {isAtLimit && (
              <div className="mt-2">
                <button 
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    // Handle upgrade - could open upgrade modal or redirect
                    console.log('Upgrade to Professional');
                  }}
                >
                  Nâng cấp lên Professional - 50 lượt/ngày
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  
  // Toolbar states
  const [activeTools, setActiveTools] = useState<Set<string>>(new Set());
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [textEditMode, setTextEditMode] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);

  const templates = [
    { id: "promo", name: "Flash Promo", ratio: "1:1" },
    { id: "launch", name: "Ra mắt sản phẩm", ratio: "4:5" },
    { id: "quote", name: "Trích dẫn thương hiệu", ratio: "1:1" },
    { id: "carousel", name: "Carousel 5 slides", ratio: "4:5" },
  ];

  const hours = customGoldenHours || ['09:00', '12:30', '20:00'];
  const dims = getResponsiveDims(activeTab === "social" ? ratio : videoRatio, previewDevice);

  // Smart scheduling function with Gemini AI
  const suggestOptimalTime = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required inputs in order
      if (!title.trim()) {
        showToast({
          type: 'warning',
          title: 'Thiếu thông tin',
          message: 'Vui lòng nhập Tiêu đề/Hook trước khi sử dụng AI gợi ý thời gian'
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!primaryText.trim()) {
        showToast({
          type: 'warning',
          title: 'Thiếu nội dung',
          message: 'Vui lòng tạo caption trước khi sử dụng AI gợi ý thời gian'
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!hashtags.trim()) {
        showToast({
          type: 'warning',
          title: 'Thiếu hashtag',
          message: 'Vui lòng tạo hashtag trước khi sử dụng AI gợi ý thời gian'
        });
        setIsSubmitting(false);
        return;
      }
      
      const selectedPlatforms = Array.from(selectedChannels);
      
      if (selectedPlatforms.length === 0) {
        showToast({
          type: 'warning',
          title: 'Chưa chọn kênh',
          message: 'Vui lòng chọn ít nhất một kênh trước khi gợi ý thời gian'
        });
        return;
      }
      
      // Show loading toast
      showToast({
        type: 'info',
        title: 'AI đang phân tích...',
        message: 'Đang tìm thời gian tối ưu để đăng bài',
        duration: 3000
      });
      
      // Map UI channels to API platforms (now unified)
      const platformMapping: { [key: string]: string } = {
        'facebook': 'facebook',
        'instagram': 'instagram',
        'zalo': 'zalo',
        'tiktok': 'tiktok'
      };
      
      const apiPlatforms = selectedPlatforms.map(p => platformMapping[p] || p);
      
      const response = await fetch('/api/ai/optimal-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platforms: apiPlatforms,
          contentType: 'promotional',
          targetAudience: 'general',
          timezone: 'Asia/Ho_Chi_Minh'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle rate limit specifically
        if (response.status === 429) {
          const rateLimitMessage = errorData.upgrade_info || errorData.message || 'Đã hết lượt sử dụng AI';
          showToast({
            type: 'error',
            title: 'Hết lượt AI',
            message: rateLimitMessage,
            action: {
              label: 'Nâng cấp tài khoản',
              onClick: () => {
                console.log('Upgrade account');
              }
            }
          });
          
          // Show upgrade modal or notification
          if (errorData.stats) {
            console.log('Rate limit stats:', errorData.stats);
          }
          
          return;
        }
        
        throw new Error(errorData.error || 'Không thể gợi ý thời gian');
      }

      const data = await response.json();
      const suggestions = data.suggestions;
      
      if (suggestions && suggestions.length > 0) {
        // Use the first suggested time from the primary platform
        const primarySuggestion = suggestions[0];
        const suggestedTime = primarySuggestion.times[0];
        
        // Set for tomorrow if all times today have passed
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        
        const [hour, minute] = suggestedTime.split(':').map(Number);
        const currentHour = now.getHours();
        const suggestedDate = currentHour >= hour ? tomorrow : now;
        suggestedDate.setHours(hour, minute, 0, 0);
        
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatted = `${suggestedDate.getFullYear()}-${pad(suggestedDate.getMonth() + 1)}-${pad(suggestedDate.getDate())}T${pad(suggestedDate.getHours())}:${pad(suggestedDate.getMinutes())}`;
        setScheduleAt(formatted);
        
        // Show success message
        showToast({
          type: 'success',
          title: 'Tìm thấy thời gian tối ưu!',
          message: `AI đề xuất đăng lúc ${suggestedTime} để đạt hiệu quả tốt nhất`
        });
        
        // Refresh AI usage stats after successful AI call
        if (onAIUsageUpdate) {
          onAIUsageUpdate();
        }
        // Also refresh local stats
        await fetchAIUsageStats();
      }
      
    } catch (error) {
      console.error('Optimal time suggestion error:', error);
      showToast({
        type: 'error',
        title: 'Lỗi gợi ý thời gian',
        message: error instanceof Error ? error.message : 'Lỗi khi gợi ý thời gian tối ưu'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const addBeat = () => setBeats((b) => [...b, { time: Math.min(duration - 1, (b[b.length - 1]?.time || 0) + 3), text: "Beat" }]);
  const removeBeat = (idx: number) => setBeats((b) => b.filter((_, i) => i !== idx));

  const autoScript = async () => {
    try {
      setIsSubmitting(true);
      
      // Show loading toast
      showToast({
        type: 'info',
        title: 'AI đang tạo script...',
        message: 'Vui lòng đợi trong giây lát',
        duration: 3000
      });
      
      // Map video platforms to API platforms
      const platformMapping: { [key: string]: string } = {
        "Facebook Page Video": "facebook",
        "Instagram Reels": "instagram", 
        "Zalo OA Video": "zalo"
      };
      const currentPlatform = platformMapping[videoPlatform] || "instagram";
      
      const response = await fetch('/api/ai/script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: currentPlatform,
          duration: duration,
          title: hook || title || 'Video viral',
          content: sub || primaryText,
          style: 'promotional'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tạo script');
      }

      const data = await response.json();
      const script = data.script;
      
      // Update UI with generated script
      setHook(script.hook);
      setSub(script.cta);
      setBeats(script.beats || []);
      
      // Show success message
      showToast({
        type: 'success',
        title: 'Tạo script thành công!',
        message: 'AI đã tạo script video phù hợp với yêu cầu của bạn'
      });
      
      // Refresh AI usage stats after successful AI call
      if (onAIUsageUpdate) {
        onAIUsageUpdate();
      }
      // Also refresh local stats
      await fetchAIUsageStats();
    } catch (error) {
      console.error('Auto script error:', error);
      showToast({
        type: 'error',
        title: 'Lỗi tạo script',
        message: error instanceof Error ? error.message : 'Lỗi khi tạo script tự động'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-fill datetime when defaultDateTime is provided
  useEffect(() => {
    if (defaultDateTime) {
      const targetDate = new Date(defaultDateTime);
      const now = new Date();
      targetDate.setHours(now.getHours() + 1, now.getMinutes(), 0, 0);
      
      const pad = (n: number) => String(n).padStart(2, '0');
      const formatted = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}T${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}`;
      setScheduleAt(formatted);
    }
  }, [defaultDateTime]);

  // Auto-fill data when editing a post
  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || '');
      setPrimaryText(editingPost.content || '');
      
      // Convert providers from API format to UI format (now unified - no conversion needed)
      const providerMapping: { [key: string]: string } = {
        'facebook': 'facebook',
        'instagram': 'instagram',
        'zalo': 'zalo'
      };
      
      const uiProviders = editingPost.providers.map(p => providerMapping[p] || p);
      setSelectedChannels(new Set(uiProviders));
      
      // Format datetime for input
      if (editingPost.datetime) {
        const date = new Date(editingPost.datetime);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        setScheduleAt(formatted);
      }
      
      // Set existing images if any
      if (editingPost.mediaUrls && editingPost.mediaUrls.length > 0) {
        const existingImages = editingPost.mediaUrls.map((url, index) => ({
          id: `existing-${index}`,
          file: new File([], `existing-image-${index}`),
          publicUrl: url,
          path: url,
          uploading: false
        }));
        setInitialEditImages(existingImages); // Store for ImageUpload initialization
        setUploadedImages(existingImages); // Also set current state
      } else {
        setInitialEditImages([]);
        setUploadedImages([]);
      }
    } else {
      // Reset when not editing
      setInitialEditImages([]);
    }
  }, [editingPost]);
  
  // Auto-save draft
  useEffect(() => {
    const saveDraft = () => {
      const draft = {
        title,
        primaryText,
        hook,
        sub,
        hashtags,
        platform,
        videoPlatform,
        scheduleAt,
        selectedChannels: Array.from(selectedChannels),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('compose-draft', JSON.stringify(draft));
    };
    
    const timer = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timer);
  }, [title, primaryText, hook, sub, hashtags, platform, videoPlatform, scheduleAt, selectedChannels]);
  
  // Load draft on mount
  useEffect(() => {
    const loadDraft = () => {
      const saved = localStorage.getItem('compose-draft');
      if (saved && !editingPost) {
        try {
          const draft = JSON.parse(saved);
          const ageMs = new Date().getTime() - new Date(draft.updatedAt).getTime();
          // Only load if less than 24 hours old
          if (ageMs < 24 * 60 * 60 * 1000) {
            setTitle(draft.title || '');
            setPrimaryText(draft.primaryText || '');
            setHook(draft.hook || '');
            setSub(draft.sub || '');
            setHashtags(draft.hashtags || '');
            setPlatform(draft.platform || 'instagram');
            setVideoPlatform(draft.videoPlatform || 'Instagram Reels');
            if (draft.scheduleAt) setScheduleAt(draft.scheduleAt);
            setSelectedChannels(new Set(draft.selectedChannels || []));
          }
        } catch (error) {
          console.error('Error loading draft:', error);
        }
      }
    };
    
    loadDraft();
  }, [editingPost]);

  const toggleChannel = (channel: string) => {
    const newChannels = new Set(selectedChannels);
    if (newChannels.has(channel)) {
      newChannels.delete(channel);
    } else {
      newChannels.add(channel);
    }
    setSelectedChannels(newChannels);
  };

  const setGoldenHour = (hour: string) => {
    const [h, m] = hour.split(':').map(Number);
    const date = new Date(scheduleAt || Date.now());
    date.setHours(h, m, 0, 0);
    
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    setScheduleAt(formatted);
  };

  const autoCaption = async () => {
    try {
      // Validate required input
      if (!title.trim()) {
        showToast({
          type: 'warning',
          title: 'Thiếu thông tin',
          message: 'Vui lòng nhập Tiêu đề/Hook trước khi sử dụng AI tạo caption'
        });
        return;
      }
      
      // Check AI limit
      if (aiUsageStats && !aiUsageStats.allowed) {
        showToast({
          type: 'error',
          title: 'Đã hết lượt AI',
          message: 'Đã hết lượt sử dụng AI hôm nay.',
          action: {
            label: 'Nâng cấp Professional',
            onClick: () => {
              console.log('Upgrade to Professional');
              // Handle upgrade logic here
            }
          }
        });
        return;
      }
      
      setIsSubmitting(true);
      
      // Show loading toast
      showToast({
        type: 'info',
        title: 'AI đang tạo caption...',
        message: 'Vui lòng đợi trong giây lát',
        duration: 2000
      });
      
      // Map UI platform to API platform
      const platformMapping: { [key: string]: string } = {
        'Facebook Page': 'facebook',
        'Instagram Biz': 'instagram', 
        'Zalo OA': 'zalo',
        'TikTok': 'tiktok'
      };
      
      const currentPlatform = platformMapping[platform] || platform?.toLowerCase() || "instagram";
      
      // Debug log to track what we're sending
      console.log('🔧 DEBUG - AutoCaption Request:', {
        platform: currentPlatform,
        title: title.trim(),
        content: '', // Don't send existing content to avoid bias
        tone: 'exciting',
        targetAudience: 'general',
        productType: 'general'
      });
      
      // For debugging UI issues, use debug endpoint first
      const isDevelopment = process.env.NODE_ENV === 'development';
      const endpoint = isDevelopment ? '/api/debug/ui-caption-test' : '/api/ai/caption';
      
      console.log(`🌐 Using endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: currentPlatform,
          title: title.trim(), // Use title directly instead of productName
          content: '', // Don't send existing content to avoid bias
          tone: 'exciting',
          targetAudience: 'general',
          productType: 'general'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error Response:', errorData);
        throw new Error(errorData.error || 'Không thể tạo caption');
      }

      const data = await response.json();
      console.log('✅ API Success Response:', data);
      
      // Check if we have caption in response
      if (!data.caption) {
        console.error('❌ No caption in response:', data);
        throw new Error('Response không chứa caption');
      }
      
      console.log('📝 Setting caption to UI:', data.caption.substring(0, 100) + '...');
      setPrimaryText(data.caption);
      
      // Show success message
      showToast({
        type: 'success',
        title: 'Tạo caption thành công!',
        message: 'AI đã tạo caption phù hợp với sản phẩm của bạn'
      });
      
      // Refresh AI usage stats after successful AI call
      if (onAIUsageUpdate) {
        onAIUsageUpdate();
      }
      // Also refresh local stats
      await fetchAIUsageStats();
    } catch (error) {
      console.error('Auto caption error:', error);
      showToast({
        type: 'error',
        title: 'Lỗi tạo caption',
        message: error instanceof Error ? error.message : 'Lỗi khi tạo caption tự động'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const autoHashtags = async () => {
    try {
      // Validate required inputs
      if (!title.trim()) {
        showToast({
          type: 'warning',
          title: 'Thiếu thông tin',
          message: 'Vui lòng nhập Tiêu đề/Hook trước khi sử dụng AI tạo hashtag'
        });
        return;
      }
      
      if (!primaryText.trim()) {
        showToast({
          type: 'warning',
          title: 'Thiếu nội dung',
          message: 'Vui lòng tạo caption trước khi sử dụng AI tạo hashtag'
        });
        return;
      }
      
      // Check AI limit
      if (aiUsageStats && !aiUsageStats.allowed) {
        showToast({
          type: 'error',
          title: 'Đã hết lượt AI',
          message: 'Đã hết lượt sử dụng AI hôm nay.',
          action: {
            label: 'Nâng cấp Professional',
            onClick: () => {
              console.log('Upgrade to Professional');
              // Handle upgrade logic here
            }
          }
        });
        return;
      }
      
      setIsSubmitting(true);
      
      // Show loading toast
      showToast({
        type: 'info',
        title: 'AI đang tạo hashtags...',
        message: 'Vui lòng đợi trong giây lát',
        duration: 2000
      });
      
      // Map UI platform to API platform
      const platformMapping: { [key: string]: string } = {
        'Facebook Page': 'facebook',
        'Instagram Biz': 'instagram', 
        'Zalo OA': 'zalo',
        'TikTok': 'tiktok'
      };
      
      const currentPlatform = platformMapping[platform] || platform?.toLowerCase() || "instagram";
      
      // Debug log to track what we're sending
      console.log('🔧 DEBUG - AutoHashtags Request:', {
        platform: currentPlatform,
        title: title.trim(),
        content: primaryText,
        productType: 'general',
        targetAudience: 'general',
        count: 8
      });
      
      const response = await fetch('/api/ai/hashtags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: currentPlatform,
          title: title.trim(), // Use title directly
          content: primaryText,
          productType: 'general',
          targetAudience: 'general',
          count: 8
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error Response:', errorData);
        throw new Error(errorData.error || 'Không thể tạo hashtags');
      }

      const data = await response.json();
      console.log('✅ API Success Response:', data);
      
      // Check if we have hashtags in response
      if (!data.hashtags || !Array.isArray(data.hashtags)) {
        console.error('❌ No hashtags array in response:', data);
        throw new Error('Response không chứa hashtags');
      }
      
      const hashtagsString = data.hashtags.join(' ');
      console.log('📝 Setting hashtags to UI:', hashtagsString);
      setHashtags(hashtagsString);
      
      // Show success message
      showToast({
        type: 'success',
        title: 'Tạo hashtags thành công!',
        message: 'AI đã tạo hashtags phù hợp cho bài đăng của bạn'
      });
      
      // Refresh AI usage stats after successful AI call
      if (onAIUsageUpdate) {
        onAIUsageUpdate();
      }
      // Also refresh local stats
      await fetchAIUsageStats();
    } catch (error) {
      console.error('Auto hashtags error:', error);
      showToast({
        type: 'error',
        title: 'Lỗi tạo hashtags',
        message: error instanceof Error ? error.message : 'Lỗi khi tạo hashtags tự động'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toolbar functions
  const toggleTool = (toolName: string) => {
    setActiveTools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolName)) {
        newSet.delete(toolName);
      } else {
        newSet.add(toolName);
      }
      return newSet;
    });
  };

  const handleTextTool = () => {
    toggleTool('text');
    setTextEditMode(!textEditMode);
    if (!textEditMode) {
      // Gợi ý text phổ biến
      const textSuggestions = [
        "SALE 50%",
        "MUA 1 TẶNG 1", 
        "FREESHIP",
        "CHỈ HÔM NAY",
        "SIÊU ƯU ĐÃI"
      ];
      const randomText = textSuggestions[Math.floor(Math.random() * textSuggestions.length)];
      setTitle(prev => prev || randomText);
    }
  };

  const handleImageTool = (e?: React.MouseEvent) => {
    // Stop event propagation to prevent interference with ImageUpload
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Check if real upload area is being clicked to avoid conflicts
    const target = e?.target as HTMLElement;
    if (target && target.closest('[data-upload-area="real-upload"]')) {
      return;
    }
    
    // Check if preview image area is being clicked
    if (target && (target.closest('[data-preview-image-grid]') || target.closest('[data-preview-image]'))) {
      return;
    }
    
    // Prevent multiple dialogs by checking if already processing
    if (activeTools.has('image')) {
      return;
    }
    
    toggleTool('image');
    
    // Show toast instruction
    showToast({
      type: 'info',
      title: 'Thêm ảnh thiết kế',
      message: 'Chọn ảnh để hiển thị trong preview (khác với ảnh upload thật)',
      duration: 3000
    });
    
    // Create file input immediately
    const fileInput = document.createElement('input');
    fileInput.id = `preview-image-input-${Date.now()}`;
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.style.position = 'fixed';
    fileInput.style.top = '-9999px';
    fileInput.style.left = '-9999px';
    fileInput.setAttribute('data-component', 'preview-tool-input');
    
    // Add to DOM temporarily
    document.body.appendChild(fileInput);
    
    let dialogClosed = false;
    
    fileInput.onchange = async (e) => {
      if (dialogClosed) return;
      dialogClosed = true;
      
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        try {
          // Convert files to URLs for preview
          const newPreviewUrls: string[] = [];
          
          for (let i = 0; i < Math.min(files.length, 3); i++) { // Max 3 images for preview
            const file = files[i];
            const imageUrl = URL.createObjectURL(file);
            newPreviewUrls.push(imageUrl);
          }
          
          setPreviewImages(prev => [...prev, ...newPreviewUrls].slice(0, 3)); // Keep max 3
          
          showToast({
            type: 'success',
            title: 'Ảnh thiết kế đã thêm!',
            message: `${newPreviewUrls.length} ảnh đã được thêm vào preview mockup`,
            duration: 2000
          });
        } catch (error) {
          console.error('Error processing preview images:', error);
          showToast({
            type: 'error',
            title: 'Lỗi xử lý ảnh',
            message: 'Không thể thêm ảnh vào preview'
          });
        }
      }
      
      // Clean up
      try {
        document.body.removeChild(fileInput);
      } catch (e) {
        // Element might already be removed
      }
      toggleTool('image'); // Reset tool state
    };
    
    // Handle user canceling dialog
    const cleanup = () => {
      if (!dialogClosed) {
        dialogClosed = true;
        try {
          document.body.removeChild(fileInput);
        } catch (e) {
          // Element already removed
        }
        toggleTool('image'); // Reset tool state
      }
    };
    
    // Listen for focus to detect dialog close (rough approximation)
    const focusHandler = () => {
      setTimeout(() => {
        if (!fileInput.files?.length && !dialogClosed) {
          cleanup();
        }
      }, 100);
    };
    
    window.addEventListener('focus', focusHandler, { once: true });
    
    // Trigger file dialog
    try {
      // Try immediate click first
      fileInput.click();
    } catch (error) {
      console.error('❌ Error opening file dialog:', error);
      
      // Alternative approach: use setTimeout
      setTimeout(() => {
        try {
          fileInput.click();
        } catch (retryError) {
          console.error('❌ Alternative approach failed:', retryError);
          cleanup();
        }
      }, 100);
    }
    
    // Cleanup after timeout as fallback
    setTimeout(() => {
      if (!dialogClosed) {
        cleanup();
      }
      window.removeEventListener('focus', focusHandler);
    }, 30000); // 30 second timeout
  };

  const handleColorTool = () => {
    toggleTool('color');
    setShowColorPicker(!showColorPicker);
  };

  const handleLayerTool = () => {
    toggleTool('layer');
    setShowLayerPanel(!showLayerPanel);
  };

  const handleFrameTool = () => {
    toggleTool('frame');
    // Cycle through frame styles
    const frameColors = ["#000000", "#ffffff", "#ff6b6b", "#4ecdc4", "#45b7d1"];
    const currentIndex = frameColors.indexOf(brandColor);
    const nextIndex = (currentIndex + 1) % frameColors.length;
    setBrandColor(frameColors[nextIndex]);
  };

  const handleCarouselTool = () => {
    toggleTool('carousel');
    // Suggest carousel template
    const carouselTemplate = templates.find(t => t.id === "carousel");
    if (carouselTemplate) {
      setTemplate(carouselTemplate);
      setRatio("4:5");
    }
  };

  const handleSubmit = async () => {
    const isVideo = activeTab === "video";
    const currentTitle = isVideo ? hook : title;
    const currentContent = isVideo ? sub : primaryText;
    
    // Check rate limit first (skip for editing existing posts)
    if (!editingPost) {
      const rateLimitCheck = await checkRateLimit();
      if (!rateLimitCheck?.allowed) {
        const reason = getBlockedReason();
        showToast({
          type: 'warning',
          title: 'Đã hết giới hạn đăng bài',
          message: reason || 'Bạn đã vượt quá giới hạn đăng bài.',
          action: {
            label: 'Nâng cấp tài khoản',
            onClick: () => {
              // TODO: Implement upgrade flow
              console.log('Upgrade account clicked');
            }
          },
          duration: 6000
        });
        return;
      }
    }
    
    // Validation
    const errors: string[] = [];
    
    if (!currentTitle.trim()) {
      errors.push(isVideo ? 'Vui lòng nhập Hook!' : 'Vui lòng nhập tiêu đề!');
    }
    
    if (!currentContent.trim()) {
      errors.push(isVideo ? 'Vui lòng nhập phụ đề!' : 'Vui lòng nhập nội dung!');
    }
    
    if (selectedChannels.size === 0) {
      errors.push('Vui lòng chọn ít nhất một kênh đăng!');
    }
    
    if (errors.length > 0) {
      showToast({
        type: 'error',
        title: 'Thiếu thông tin bắt buộc',
        message: errors.join('\n')
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get URLs of successfully uploaded images
      const mediaUrls = uploadedImages
        .filter(img => !img.uploading && !img.error && img.publicUrl)
        .map(img => img.publicUrl);
      
      // Submit with enhanced metadata
      await onSubmit({
        title: currentTitle.trim(),
        content: currentContent.trim(),
        channels: Array.from(selectedChannels),
        scheduleAt: scheduleAt || new Date().toISOString(),
        mediaUrls,
        postId: editingPost?.id,
        metadata: isVideo ? {
          type: 'video',
          platform: videoPlatform,
          ratio: videoRatio,
          duration,
          hook,
          beats,
          sub,
          overlayCTA,
        } : {
          type: 'social',
          platform,
          ratio,
          hashtags,
          cta,
          brandColor,
          template: template?.id
        }
      });
      
      // Refresh activity logs after successful action
      if (onActivityLogsUpdate) {
        setTimeout(() => {
          onActivityLogsUpdate();
        }, 500);
      }
      
      // Show success message
      showToast({
        type: 'success',
        title: 'Tạo bài đăng thành công!',
        message: 'Bài đăng đã được lên lịch và sẽ được đăng tự động'
      });
      
      // Reset form only if not editing
      if (!editingPost) {
        resetForm();
        // Clear saved draft
        localStorage.removeItem('compose-draft');
      }
      onClose();
      
    } catch (error) {
      console.error('Error submitting post:', error);
      
      // Handle post limit exceeded error
      if (error instanceof Error && error.message.includes('Post limit exceeded')) {
        showToast({
          type: 'error',
          title: 'Hết lượt đăng bài',
          message: 'Bạn đã hết giới hạn số bài đăng trong tháng.',
          action: {
            label: 'Nâng cấp tài khoản',
            onClick: () => {
              console.log('Upgrade account');
              // Handle upgrade logic here
            }
          }
        });
      } else if ((error as any)?.status === 429) {
        const errorData = (error as any)?.data;
        showToast({
          type: 'error',
          title: 'Vượt quá giới hạn',
          message: errorData?.message || 'Bạn đã vượt quá giới hạn số bài đăng trong tháng.'
        });
      } else {
        showToast({
          type: 'error',
          title: 'Lỗi tạo bài đăng',
          message: 'Có lỗi xảy ra khi tạo bài đăng. Vui lòng thử lại.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setPrimaryText("");
    setHashtags("");
    setCta("Mua ngay");
    setHook("");
    setSub("");
    setOverlayCTA("Xem ngay");
    setUploadedImages([]);
    
    // Clean up preview images URLs to prevent memory leaks
    previewImages.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setPreviewImages([]);
    
    setTemplate(null);
    setActiveTools(new Set());
    setShowColorPicker(false);
    setTextEditMode(false);
    setShowLayerPanel(false);
    setScheduleAt('');
    setSelectedChannels(new Set(['facebook', 'instagram']));
    setBrandColor('#0ea5e9');
    setRatio('1:1');
    setPlatform('Facebook Page');
    setPreviewDevice('mobile');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-7xl max-h-[95vh] rounded-2xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden">
        <div className="max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="text-lg font-semibold">
              {editingPost ? 'Chỉnh sửa bài đăng' : 'Tạo bài đăng mới'}
            </h3>
            <button 
              onClick={onClose}
              className="rounded-full p-2 hover:bg-gray-100" 
              aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Controls */}
            <div className="space-y-5">
              {/* Tab Navigation */}
              <div className="relative flex bg-gray-100 rounded-lg p-1 mb-6">
                {/* Animated background pill */}
                <motion.div
                  className="absolute top-1 bottom-1 bg-gray-900 rounded-md shadow-sm"
                  initial={false}
                  animate={{
                    left: activeTab === "social" ? "0.25rem" : "50%",
                    right: activeTab === "social" ? "50%" : "0.25rem"
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                />
                
                {/* Tab buttons */}
                <button
                  onClick={() => setActiveTab("social")}
                  className={`relative z-10 flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "social"
                      ? "text-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Bài đăng Mạng xã Hội
                </button>
                <button
                  onClick={() => setActiveTab("video")}
                  className={`relative z-10 flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "video"
                      ? "text-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Video / Reel / Shorts
                </button>
              </div>

              {/* Social Post Form */}
              {activeTab === "social" && (
                <>
                  {/* Platform Selection */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(PROVIDERS).map(([key, provider]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPlatform(provider.label)}
                        className={`px-3 py-2 rounded-xl text-sm border transition ${
                          platform === provider.label
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {provider.label}
                      </button>
                    ))}
                  </div>

                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <ToolbarButton 
                      icon={TypeIcon} 
                      label="Văn bản" 
                      active={activeTools.has('text')} 
                      onClick={handleTextTool} 
                    />
                    <div className="relative">
                      <ToolbarButton 
                        icon={ImageIcon} 
                        label="Thêm ảnh preview" 
                        active={activeTools.has('image')} 
                        onClick={(e) => handleImageTool(e)} 
                      />
                      {previewImages.length > 0 && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {previewImages.length}
                        </div>
                      )}
                    </div>
                    
                    <ToolbarButton 
                      icon={Palette} 
                      label="Màu sắc" 
                      active={activeTools.has('color')} 
                      onClick={handleColorTool} 
                    />
                    <ToolbarButton 
                      icon={Layers} 
                      label="Lớp" 
                      active={activeTools.has('layer')} 
                      onClick={handleLayerTool} 
                    />
                    <ToolbarButton 
                      icon={SquareStack} 
                      label="Khung" 
                      active={activeTools.has('frame')} 
                      onClick={handleFrameTool} 
                    />
                    <ToolbarButton 
                      icon={Rows3} 
                      label="Carousel" 
                      active={activeTools.has('carousel')} 
                      onClick={handleCarouselTool} 
                    />
                  </div>

                  {/* Ratio and Brand Color */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Tỉ lệ khung hình" hint="Gợi ý theo nền tảng" required={false}>
                      <select 
                        className="w-full border rounded-xl px-3 py-2" 
                        value={ratio} 
                        onChange={(e) => setRatio(e.target.value)}
                      >
                        {RATIOS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Màu thương hiệu" hint="" required={false}>
                      <input 
                        type="color" 
                        className="w-full h-10 border rounded-xl p-0" 
                        value={brandColor} 
                        onChange={(e) => setBrandColor(e.target.value)} 
                      />
                    </Field>
                  </div>

                  {/* Tool Panels */}
                  {showColorPicker && activeTools.has('color') && (
                    <div className="border rounded-xl p-4 bg-gray-50">
                      <h4 className="font-medium mb-3">Bảng màu nâng cao</h4>
                      <div className="grid grid-cols-6 gap-2 mb-3">
                        {["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#f0932b", "#eb4d4b", "#6c5ce7", "#00b894"].map(color => (
                          <button
                            key={color}
                            className="w-8 h-8 rounded border-2 border-white shadow"
                            style={{ backgroundColor: color }}
                            onClick={() => setBrandColor(color)}
                          />
                        ))}
                      </div>
                      <input 
                        type="color" 
                        className="w-full h-10 border rounded-xl" 
                        value={brandColor} 
                        onChange={(e) => setBrandColor(e.target.value)} 
                      />
                    </div>
                  )}

                  {showLayerPanel && activeTools.has('layer') && (
                    <div className="border rounded-xl p-4 bg-gray-50">
                      <h4 className="font-medium mb-3">Quản lý lớp</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm">Background</span>
                          <div className="flex gap-2">
                            <button className="px-2 py-1 text-xs bg-blue-100 rounded">Hiện</button>
                            <button className="px-2 py-1 text-xs bg-gray-100 rounded">Khóa</button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm">Text Layer</span>
                          <div className="flex gap-2">
                            <button className="px-2 py-1 text-xs bg-blue-100 rounded">Hiện</button>
                            <button className="px-2 py-1 text-xs bg-gray-100 rounded">Khóa</button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm">Image Layer</span>
                          <div className="flex gap-2">
                            <button className="px-2 py-1 text-xs bg-blue-100 rounded">Hiện</button>
                            <button className="px-2 py-1 text-xs bg-gray-100 rounded">Khóa</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {textEditMode && activeTools.has('text') && (
                    <div className="border rounded-xl p-4 bg-gray-50">
                      <h4 className="font-medium mb-3">Chỉnh sửa văn bản</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Font chữ" required={false}>
                          <select className="w-full border rounded-xl px-3 py-2">
                            <option>Roboto</option>
                            <option>Inter</option>
                            <option>Poppins</option>
                            <option>Montserrat</option>
                          </select>
                        </Field>
                        <Field label="Kích thước" required={false}>
                          <input 
                            type="range" 
                            min="12" 
                            max="72" 
                            className="w-full"
                            defaultValue="24"
                          />
                        </Field>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button className="px-3 py-1 text-sm border rounded bg-white">B</button>
                        <button className="px-3 py-1 text-sm border rounded bg-white italic">I</button>
                        <button className="px-3 py-1 text-sm border rounded bg-white underline">U</button>
                      </div>
                    </div>
                  )}

              {/* Title and CTA */}
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Tiêu đề / Hook" required={true} hint="🤖 Đầu vào chính cho AI tạo caption & hashtag">
                  <input 
                    className="w-full border rounded-xl px-3 py-2" 
                    placeholder="Ví dụ: Siêu sale 9.9 - 50% off cho tất cả sản phẩm!" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                  />
                </Field>
                <Field label="CTA (Lời kêu gọi hành động)" hint="" required={false}>
                  <input 
                    className="w-full border rounded-xl px-3 py-2" 
                    placeholder="Ví dụ: Mua ngay" 
                    value={cta} 
                    onChange={(e) => setCta(e.target.value)} 
                  />
                </Field>
              </div>

              {/* Content */}
              <Field label="Nội dung chính (Caption)" hint="Có thể tự động gợi ý bằng AI" required>
                <textarea 
                  className="w-full border rounded-2xl px-3 py-2 min-h-[96px]" 
                  placeholder="Viết nội dung..." 
                  value={primaryText} 
                  onChange={(e) => setPrimaryText(e.target.value)} 
                />
                
                {/* AI Limit Warning */}
                <AILimitWarning />
                
                <div className="flex gap-2 mt-2">
                  <PermissionGate feature="ai" fallback={
                    <Button variant="outline" onClick={() => {}} disabled>
                      <Sparkles className="w-4 h-4 mr-1" /> Gợi ý caption (Premium)
                    </Button>
                  }>
                    <Button 
                      variant="outline" 
                      onClick={autoCaption}
                      disabled={!title.trim() || isSubmitting}
                    >
                      <Sparkles className="w-4 h-4 mr-1" /> 
                      {!title.trim() ? 'Nhập tiêu đề trước' : 'Gợi ý caption (AI)'}
                    </Button>
                  </PermissionGate>
                  
                  <PermissionGate feature="ai" fallback={
                    <Button variant="outline" onClick={() => {}} disabled>
                      <Hash className="w-4 h-4 mr-1" /> Sinh hashtag (Premium)
                    </Button>
                  }>
                    <Button 
                      variant="outline" 
                      onClick={autoHashtags}
                      disabled={!title.trim() || !primaryText.trim() || isSubmitting}
                    >
                      <Hash className="w-4 h-4 mr-1" /> 
                      {!title.trim() ? 'Nhập tiêu đề trước' : 
                       !primaryText.trim() ? 'Tạo caption trước' : 'Sinh hashtag (AI)'}
                    </Button>
                  </PermissionGate>
                </div>
              </Field>

              {/* Hashtags */}
              <Field label="Hashtags" hint="" required={false}>
                <input 
                  className="w-full border rounded-xl px-3 py-2" 
                  placeholder="#sale #deal #vietnam..." 
                  value={hashtags} 
                  onChange={(e) => setHashtags(e.target.value)} 
                />
              </Field>

              {/* Image Upload */}
              {session?.user && (
                <Field label="Hình ảnh">
                  <ImageUpload
                    userId={(session?.user as any)?.id || undefined}
                    maxImages={4}
                    onImagesChange={setUploadedImages}
                    className="mt-2"
                    initialImages={initialEditImages} // Pass initial images for edit mode
                    key={editingPost?.id || 'new'} // Force re-render when editing different post
                  />
                  
                  {/* Image selection for preview */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Chọn ảnh cho preview:</h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              // Select all uploaded images for preview
                              const imageUrls = uploadedImages
                                .filter(img => img.publicUrl && !img.uploading)
                                .map(img => img.publicUrl)
                                .slice(0, 3);
                              
                              if (imageUrls.length > 0) {
                                setPreviewImages(imageUrls);
                                showToast({
                                  type: 'success',
                                  title: 'Đã chọn tất cả ảnh!',
                                  message: `${imageUrls.length} ảnh đã được thêm vào preview`
                                });
                              }
                            }}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                          >
                            Chọn tất cả
                          </button>
                          <button
                            onClick={() => {
                              setPreviewImages([]);
                              showToast({
                                type: 'info',
                                title: 'Đã xóa preview',
                                message: 'Tất cả ảnh preview đã được xóa'
                              });
                            }}
                            className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                          >
                            Xóa tất cả
                          </button>
                        </div>
                      </div>
                      
                      {/* Individual image selection */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-preview-image-grid>
                        {uploadedImages
                          .filter(img => img.publicUrl && !img.uploading)
                          .map((img, index) => {
                            const isSelected = previewImages.includes(img.publicUrl);
                            return (
                              <div
                                key={img.id}
                                data-preview-image
                                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                  isSelected 
                                    ? 'border-blue-500 ring-2 ring-blue-200' 
                                    : 'border-gray-200 hover:border-blue-300'
                                }`}
                                onClick={(e) => {
                                  // Prevent event bubbling to avoid triggering parent handlers
                                  e.stopPropagation();
                                  e.preventDefault();
                                  // Stop other listeners on same element
                                  (e.nativeEvent as any).stopImmediatePropagation?.();
                                  
                                  if (isSelected) {
                                    // Remove from preview
                                    setPreviewImages(prev => prev.filter(url => url !== img.publicUrl));
                                    showToast({
                                      type: 'info',
                                      title: 'Đã bỏ chọn ảnh',
                                      message: 'Ảnh đã được xóa khỏi preview'
                                    });
                                  } else {
                                    // Add to preview (max 3)
                                    if (previewImages.length < 3) {
                                      setPreviewImages(prev => [...prev, img.publicUrl]);
                                      showToast({
                                        type: 'success',
                                        title: 'Đã thêm ảnh',
                                        message: 'Ảnh đã được thêm vào preview'
                                      });
                                    } else {
                                      showToast({
                                        type: 'warning',
                                        title: 'Giới hạn 3 ảnh',
                                        message: 'Preview chỉ hỗ trợ tối đa 3 ảnh'
                                      });
                                    }
                                  }
                                }}
                              >
                                <img
                                  src={img.publicUrl}
                                  alt={`Upload ${index + 1}`}
                                  className="w-full h-16 object-cover"
                                />
                                
                                {/* Selection indicator */}
                                <div className={`absolute top-1 right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                                  isSelected ? 'bg-blue-500' : 'bg-gray-400 opacity-60'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                
                                {/* Preview position indicator */}
                                {isSelected && (
                                  <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                                    {previewImages.indexOf(img.publicUrl) + 1}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        }
                      </div>
                      
                      {previewImages.length > 0 && (
                        <div className="text-xs text-gray-500 mt-2">
                          ✓ {previewImages.length} ảnh đã chọn cho preview
                        </div>
                      )}
                    </div>
                  )}
                </Field>
              )}

              {/* Options */}
              <div className="flex flex-wrap items-center gap-2">
                <Toggle checked={gridOn} onChange={setGridOn} label="Hiển thị lưới" />
                <Toggle checked={safeAreaOn} onChange={setSafeAreaOn} label="Vùng an toàn chữ" />
              </div>

              {/* Templates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-800">Chọn template</h4>
                  <Button variant="ghost" onClick={() => setTemplate(null)}>
                    Bỏ chọn
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {templates.map((tpl) => (
                    <TemplateCard
                      key={tpl.id}
                      tpl={tpl}
                      selected={template?.id === tpl.id}
                      onSelect={(t: any) => {
                        setTemplate(t);
                        setRatio(t.ratio);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Channels Selection */}
              <div>
                <div className="mb-2 text-sm font-medium">Kênh đăng</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PROVIDERS).map(([key, provider]) => (
                    <button
                      key={key}
                      onClick={() => toggleChannel(key)}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        selectedChannels.has(key)
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {provider.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Thời gian đăng</span>
                  <PermissionGate 
                    feature="ai"
                    fallback={
                      <Button 
                        variant="outline" 
                        onClick={() => {}}
                        className="text-xs px-2 py-1"
                        disabled
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Gợi ý AI (Premium)
                      </Button>
                    }
                  >
                    <Button 
                      variant="outline" 
                      onClick={suggestOptimalTime}
                      className="text-xs px-2 py-1"
                      disabled={!title.trim() || !primaryText.trim() || !hashtags.trim() || isSubmitting}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {!title.trim() ? 'Nhập tiêu đề trước' :
                       !primaryText.trim() ? 'Tạo caption trước' :
                       !hashtags.trim() ? 'Tạo hashtag trước' : 'Gợi ý thời gian (AI)'}
                    </Button>
                  </PermissionGate>
                </div>
                <input 
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {hours.map(hour => (
                    <button
                      key={hour}
                      onClick={() => setGoldenHour(hour)}
                      className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700 ring-1 ring-yellow-200 hover:bg-yellow-100"
                    >
                      Giờ vàng: {hour}
                    </button>
                  ))}
                  <Button 
                    variant="ghost" 
                    onClick={() => setScheduleAt('')}
                    className="text-xs px-2 py-1"
                  >
                    Đặt lại
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {Array.from(selectedChannels).length} kênh được chọn
                  </span>
                  {uploadedImages.some(img => img.uploading) && (
                    <span className="text-sm text-blue-600">
                      Đang tải ảnh...
                    </span>
                  )}
                  {/* Rate limit status */}
                  {rateLimitData && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rateLimitData.allowed 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {getRateLimitMessage(rateLimitData)}
                    </span>
                  )}
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting || 
                    uploadedImages.some(img => img.uploading) ||
                    (!editingPost && !canCreatePost()) // Disable for new posts if rate limited
                  }
                  className={`px-6 py-2 font-medium transition-all flex items-center gap-2 ${
                    isSubmitting || (!editingPost && !canCreatePost())
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : scheduleAt 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      {editingPost ? 'Cập nhật bài đăng' : scheduleAt ? 'Lên lịch đăng' : 'Đăng ngay'}
                    </>
                  )}
                </Button>
              </div>
                </>
              )}

              {/* Video Form */}
              {activeTab === "video" && (
                <>
                  {/* Video Platform Selection - Based on actual supported providers */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: "fb_video", label: "Facebook Page Video" },
                      { key: "ig_reels", label: "Instagram Reels" },
                      { key: "zalo_video", label: "Zalo OA Video" }
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setVideoPlatform(p.label)}
                        className={`px-3 py-2 rounded-xl text-sm border transition ${
                          videoPlatform === p.label
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Video Settings */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <Field label="Tỷ lệ video" required hint="Gợi ý theo nền tảng">
                      <select 
                        className="w-full border rounded-xl px-3 py-2" 
                        value={videoRatio} 
                        onChange={(e) => setVideoRatio(e.target.value)}
                      >
                        <option value="9:16">Dọc (9:16)</option>
                        <option value="16:9">Ngang (16:9)</option>
                        <option value="1:1">Vuông (1:1)</option>
                      </select>
                    </Field>
                    <Field label="Thời lượng" required hint="Giây">
                      <input 
                        type="number"
                        className="w-full border rounded-xl px-3 py-2" 
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value) || 15)}
                        min="5"
                        max="180"
                      />
                    </Field>
                    <Field label="CTA overlay" required hint="Text trên video">
                      <input 
                        className="w-full border rounded-xl px-3 py-2" 
                        value={overlayCTA} 
                        onChange={(e) => setOverlayCTA(e.target.value)} 
                        placeholder="Xem ngay" 
                      />
                    </Field>
                  </div>

                  {/* Hook mở đầu */}
                  <Field label="Hook mở đầu" required hint="Câu đầu tiên phải mạnh & rõ lợi ích">
                    <input 
                      className="w-full border rounded-xl px-3 py-2" 
                      value={hook} 
                      onChange={(e) => setHook(e.target.value)} 
                      placeholder="Ví dụ: Đừng mua online nếu chưa biết 3 mẹo này!" 
                    />
                  </Field>

                  {/* Phụ đề (Subtitle) */}
                  <Field label="Phụ đề (sub) / Script" required hint="Dán văn bản để auto-sub">
                    <textarea 
                      className="w-full border rounded-xl px-3 py-2 min-h-[96px] resize-none" 
                      value={sub} 
                      onChange={(e) => setSub(e.target.value)} 
                      placeholder="Nội dung thoại hoặc phụ đề..."
                    />
                  </Field>

                  {/* Timeline Editor */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Timeline Video ({beats.length} beats)
                      </label>
                      <button
                        onClick={addBeat}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Thêm Beat
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {beats.map((beat, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <span className="text-xs font-mono text-gray-500 w-12">{beat.time}s</span>
                          <input
                            type="text"
                            value={beat.text}
                            onChange={(e) => {
                              const newBeats = [...beats];
                              newBeats[index].text = e.target.value;
                              setBeats(newBeats);
                            }}
                            placeholder="Nội dung tại thời điểm này..."
                            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => removeBeat(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Script Generator */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">AI Script Generator</span>
                    </div>
                    <button
                      onClick={autoScript}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 text-sm font-medium"
                    >
                      Tạo script tự động cho video {duration}s
                    </button>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {Array.from(selectedChannels).length} kênh được chọn
                      </span>
                      {uploadedImages.some(img => img.uploading) && (
                        <span className="text-sm text-blue-600">
                          Đang tải media...
                        </span>
                      )}
                      {/* Rate limit status */}
                      {rateLimitData && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rateLimitData.allowed 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {getRateLimitMessage(rateLimitData)}
                        </span>
                      )}
                    </div>
                    
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        isSubmitting || 
                        uploadedImages.some(img => img.uploading) ||
                        (!editingPost && !canCreatePost()) // Disable for new posts if rate limited
                      }
                      className={`px-6 py-2 font-medium transition-all flex items-center gap-2 ${
                        isSubmitting || (!editingPost && !canCreatePost())
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : scheduleAt 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4" />
                          {editingPost ? 'Cập nhật video' : scheduleAt ? 'Lên lịch video' : 'Đăng video ngay'}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Right: Preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button 
                  variant={previewDevice === 'mobile' ? "primary" : "ghost"} 
                  onClick={() => setPreviewDevice('mobile')}
                  className={previewDevice === 'mobile' ? 'bg-blue-600 text-white' : ''}
                >
                  <Smartphone className="w-4 h-4 mr-1" /> Mobile
                </Button>
                <Button 
                  variant={previewDevice === 'tablet' ? "primary" : "ghost"} 
                  onClick={() => setPreviewDevice('tablet')}
                  className={previewDevice === 'tablet' ? 'bg-blue-600 text-white' : ''}
                >
                  <Tablet className="w-4 h-4 mr-1" /> Tablet
                </Button>
                <Button 
                  variant={previewDevice === 'desktop' ? "primary" : "ghost"} 
                  onClick={() => setPreviewDevice('desktop')}
                  className={previewDevice === 'desktop' ? 'bg-blue-600 text-white' : ''}
                >
                  <Monitor className="w-4 h-4 mr-1" /> Desktop
                </Button>
                <div className="ml-auto text-sm text-gray-500">
                  Nền tảng: <span className="font-medium text-gray-700">{activeTab === "video" ? videoPlatform : platform}</span>
                </div>
              </div>

              <div className="rounded-3xl border bg-white p-4">
                {/* Social Post Preview */}
                {activeTab === "social" && (
                  <div 
                    className="relative mx-auto rounded-2xl overflow-hidden shadow" 
                    style={{ 
                      width: dims.w, 
                      height: dims.h, 
                      background: "#f8fafc" 
                    }}
                  >
                    {/* Safe area */}
                    {safeAreaOn && (
                      <div className="absolute inset-3 rounded-xl border-2 border-dashed border-emerald-300 pointer-events-none" />
                    )}
                    
                    {/* Grid */}
                    {gridOn && (
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-40">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className="border border-gray-200" />
                        ))}
                      </div>
                    )}

                    {/* Mock background */}
                    <div 
                      className="absolute inset-0" 
                      style={{ background: `linear-gradient(135deg, ${brandColor}33, #ffffff)` }} 
                    />

                    {/* Mock heading */}
                    <div className="absolute top-4 left-4 right-4">
                      <h3 className="text-white drop-shadow text-xl font-extrabold uppercase tracking-wide">
                        {title || "TIÊU ĐỀ / HOOK"}
                      </h3>
                    </div>

                    {/* Preview Images */}
                    {previewImages.length > 0 && (
                      <div className="absolute top-16 left-4 right-4 bottom-20">
                        <div className="h-full rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm">
                          {previewImages.length === 1 ? (
                            // Single image - full size
                            <img 
                              src={previewImages[0]} 
                              alt="Preview" 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : previewImages.length === 2 ? (
                            // Two images - side by side
                            <div className="flex gap-1 h-full">
                              {previewImages.map((img, idx) => (
                                <img 
                                  key={idx}
                                  src={img} 
                                  alt={`Preview ${idx + 1}`} 
                                  className="flex-1 h-full object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          ) : (
                            // Three or more images - grid layout
                            <div className="grid grid-cols-2 gap-1 h-full">
                              <img 
                                src={previewImages[0]} 
                                alt="Preview 1" 
                                className="col-span-2 h-2/3 w-full object-cover rounded-lg"
                              />
                              <img 
                                src={previewImages[1]} 
                                alt="Preview 2" 
                                className="h-full w-full object-cover rounded-lg"
                              />
                              {previewImages[2] && (
                                <img 
                                  src={previewImages[2]} 
                                  alt="Preview 3" 
                                  className="h-full w-full object-cover rounded-lg"
                                />
                              )}
                            </div>
                          )}
                          
                          {/* Clear images button */}
                          <button
                            onClick={() => {
                              setPreviewImages([]);
                              showToast({
                                type: 'info',
                                title: 'Đã xóa ảnh preview',
                                message: 'Tất cả ảnh preview đã được xóa'
                              });
                            }}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg transition-colors"
                            title="Xóa tất cả ảnh preview"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mock body */}
                    <div className="absolute left-4 right-4 bottom-4">
                      <p className="bg-white/90 rounded-xl px-3 py-2 text-sm text-gray-800 line-clamp-4">
                        {primaryText || "Viết nội dung caption tại đây. Sử dụng AI để gợi ý nhanh và tối ưu hoá cho nền tảng!"}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-gray-700">
                          {hashtags || "#hashtag #brand #sale"}
                        </span>
                        <span className="inline-flex items-center text-[11px] px-2 py-1 rounded-full bg-blue-600 text-white">
                          {cta}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video Preview */}
                {activeTab === "video" && (
                  <div 
                    className="relative mx-auto rounded-2xl overflow-hidden shadow" 
                    style={{ 
                      width: dims.w, 
                      height: dims.h, 
                      background: "#0f172a" 
                    }}
                  >
                    {/* Timeline bar at top */}
                    <div className="absolute top-2 left-4 right-4 flex items-center">
                      <div className="flex items-center gap-2 text-white/60 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>{duration}s timeline</span>
                      </div>
                    </div>

                    {/* Hook overlay at top */}
                    <div className="absolute top-8 left-4 right-4">
                      <div className="bg-white rounded-lg px-3 py-2 shadow-lg">
                        <p className="text-sm font-medium text-gray-900">
                          {hook || "3 mẹo tiết kiệm 30% khi mua online mà ít ai biết!"}
                        </p>
                      </div>
                    </div>

                    {/* Timeline markers at bottom */}
                    <div className="absolute bottom-16 left-4 right-4">
                      <div className="relative h-1 bg-white/20 rounded-full">
                        {beats.map((beat, index) => (
                          <div
                            key={index}
                            className="absolute w-0.5 h-4 bg-purple-500 rounded-full transform -translate-y-1.5"
                            style={{ left: `${(beat.time / duration) * 100}%` }}
                            title={`${beat.time}s - ${beat.text}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* CTA pill at bottom right */}
                    <div className="absolute bottom-4 right-4">
                      <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                        {overlayCTA || "Xem ngay"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview Image Controls */}
                {activeTab === "social" && previewImages.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        Preview Images ({previewImages.length}/3)
                      </h4>
                      <button
                        onClick={() => {
                          // Clear preview images and cleanup URLs
                          previewImages.forEach(url => {
                            if (url.startsWith('blob:')) {
                              URL.revokeObjectURL(url);
                            }
                          });
                          setPreviewImages([]);
                          showToast({
                            type: 'info',
                            title: 'Đã xóa preview',
                            message: 'Tất cả ảnh preview đã được xóa'
                          });
                        }}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {previewImages.map((imageUrl, index) => (
                        <div
                          key={`preview-${index}`}
                          className="relative flex-shrink-0 group"
                        >
                          <img
                            src={imageUrl}
                            alt={`Preview ${index + 1}`}
                            className="w-16 h-16 object-cover rounded border"
                          />
                          
                          {/* Position indicator */}
                          <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                            {index + 1}
                          </div>
                          
                          {/* Remove button */}
                          <button
                            onClick={() => {
                              const newImages = [...previewImages];
                              const removedUrl = newImages.splice(index, 1)[0];
                              
                              // Cleanup blob URL if needed
                              if (removedUrl.startsWith('blob:')) {
                                URL.revokeObjectURL(removedUrl);
                              }
                              
                              setPreviewImages(newImages);
                              showToast({
                                type: 'info',
                                title: 'Đã xóa ảnh',
                                message: `Ảnh ${index + 1} đã được xóa khỏi preview`
                              });
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          
                          {/* Move buttons for reordering */}
                          {previewImages.length > 1 && (
                            <div className="absolute bottom-0 left-0 right-0 flex opacity-0 group-hover:opacity-100 transition-opacity">
                              {index > 0 && (
                                <button
                                  onClick={() => {
                                    const newImages = [...previewImages];
                                    [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
                                    setPreviewImages(newImages);
                                  }}
                                  className="flex-1 bg-blue-500 text-white text-xs py-1 hover:bg-blue-600"
                                  title="Di chuyển lên"
                                >
                                  ↑
                                </button>
                              )}
                              {index < previewImages.length - 1 && (
                                <button
                                  onClick={() => {
                                    const newImages = [...previewImages];
                                    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
                                    setPreviewImages(newImages);
                                  }}
                                  className="flex-1 bg-blue-500 text-white text-xs py-1 hover:bg-blue-600"
                                  title="Di chuyển xuống"
                                >
                                  ↓
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-2">
                      💡 Click vào ảnh để xóa, sử dụng nút mũi tên để sắp xếp lại thứ tự
                    </div>
                  </div>
                )}

                {/* Checklist */}
                {activeTab === "social" && (
                  <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4" /> Kiểm tra độ dài caption, cấm từ nhạy cảm
                    </li>
                    <li className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4" /> Thống nhất màu chữ / tương phản ≥ 4.5
                    </li>
                    <li className="flex items-center gap-2">
                      <Hash className="w-4 h-4" /> 3-8 hashtag, có branded tag
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Gợi ý khung giờ đăng theo nền tảng
                    </li>
                  </ul>
                )}

                {/* Video Checklist */}
                {activeTab === "video" && (
                  <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Hook ≤ 3s, thông điệp rõ
                    </li>
                    <li className="flex items-center gap-2">
                      <Hash className="w-4 h-4" /> 3-5 hashtag ngách
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="w-4 h-4" /> Có chữ phụ đề ≥ 42px (9:16)
                    </li>
                    <li className="flex items-center gap-2">
                      <Video className="w-4 h-4" /> End screen có CTA
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

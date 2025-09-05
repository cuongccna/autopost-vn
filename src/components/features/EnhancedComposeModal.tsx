'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from 'next-auth/react';
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
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition ${
      active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

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
}

export default function EnhancedComposeModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  goldenHours: customGoldenHours, 
  defaultDateTime, 
  editingPost 
}: EnhancedComposeModalProps) {
  const { data: session } = useSession();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("social");
  
  // Social Post Form states
  const [platform, setPlatform] = useState("Instagram");
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
  const [videoPlatform, setVideoPlatform] = useState("TikTok");
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
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set(['fb', 'ig']));
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
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
  const dims = aspectDims(activeTab === "social" ? ratio : videoRatio);

  // Smart scheduling function with Gemini AI
  const suggestOptimalTime = async () => {
    try {
      setIsSubmitting(true);
      const selectedPlatforms = Array.from(selectedChannels);
      
      if (selectedPlatforms.length === 0) {
        setValidationErrors(['Vui lòng chọn ít nhất một kênh trước khi gợi ý thời gian']);
        return;
      }
      
      // Map UI channels to API platforms
      const platformMapping: { [key: string]: string } = {
        'fb': 'facebook',
        'ig': 'instagram',
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
        
        // Show reasoning to user
        setValidationErrors([]);
      }
      
    } catch (error) {
      console.error('Optimal time suggestion error:', error);
      setValidationErrors([
        error instanceof Error ? error.message : 'Lỗi khi gợi ý thời gian tối ưu'
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };
  const addBeat = () => setBeats((b) => [...b, { time: Math.min(duration - 1, (b[b.length - 1]?.time || 0) + 3), text: "Beat" }]);
  const removeBeat = (idx: number) => setBeats((b) => b.filter((_, i) => i !== idx));

  const autoScript = async () => {
    try {
      setIsSubmitting(true);
      const currentPlatform = videoPlatform || "tiktok";
      
      const response = await fetch('/api/ai/script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: currentPlatform.toLowerCase(),
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
      setValidationErrors([]);
    } catch (error) {
      console.error('Auto script error:', error);
      setValidationErrors([
        error instanceof Error ? error.message : 'Lỗi khi tạo script tự động'
      ]);
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
      
      // Convert providers from API format to UI format
      const providerMapping: { [key: string]: string } = {
        'facebook': 'fb',
        'instagram': 'ig',
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
        setUploadedImages(existingImages);
      }
    }
  }, [editingPost]);

  // Clear validation errors when user starts typing
  useEffect(() => {
    if (validationErrors.length > 0) {
      const timer = setTimeout(() => {
        setValidationErrors([]);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [validationErrors]);
  
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
            setVideoPlatform(draft.videoPlatform || 'tiktok');
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
      setIsSubmitting(true);
      const currentPlatform = platform || "instagram";
      const productName = title || "sản phẩm";
      
      const response = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: currentPlatform.toLowerCase(),
          title: productName,
          content: primaryText,
          tone: 'exciting',
          targetAudience: 'general',
          productType: 'general'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tạo caption');
      }

      const data = await response.json();
      setPrimaryText(data.caption);
      
      // Show success message
      setValidationErrors([]);
    } catch (error) {
      console.error('Auto caption error:', error);
      setValidationErrors([
        error instanceof Error ? error.message : 'Lỗi khi tạo caption tự động'
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const autoHashtags = async () => {
    try {
      setIsSubmitting(true);
      const currentPlatform = platform || "instagram";
      
      const response = await fetch('/api/ai/hashtags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: currentPlatform.toLowerCase(),
          title: title || 'sản phẩm',
          content: primaryText,
          productType: 'general',
          targetAudience: 'general',
          count: 8
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tạo hashtags');
      }

      const data = await response.json();
      setHashtags(data.hashtags.join(' '));
      
      // Show success message
      setValidationErrors([]);
    } catch (error) {
      console.error('Auto hashtags error:', error);
      setValidationErrors([
        error instanceof Error ? error.message : 'Lỗi khi tạo hashtags tự động'
      ]);
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

  const handleImageTool = () => {
    toggleTool('image');
    // Trigger file upload dialog
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        // This would integrate with the existing ImageUpload component
        console.log('Files selected:', files.length);
      }
    };
    fileInput.click();
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
    
    // Reset validation errors
    setValidationErrors([]);
    const errors: string[] = [];
    
    // Validation
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
      setValidationErrors(errors);
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
      
      // Reset form only if not editing
      if (!editingPost) {
        resetForm();
        // Clear saved draft
        localStorage.removeItem('compose-draft');
      }
      onClose();
      
    } catch (error) {
      console.error('Error submitting post:', error);
      setValidationErrors(['Có lỗi xảy ra khi tạo bài đăng. Vui lòng thử lại.']);
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
    setTemplate(null);
    setActiveTools(new Set());
    setShowColorPicker(false);
    setTextEditMode(false);
    setShowLayerPanel(false);
    setScheduleAt('');
    setSelectedChannels(new Set(['fb', 'ig']));
    setBrandColor('#0ea5e9');
    setRatio('1:1');
    setPlatform('Instagram');
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["Facebook", "Instagram", "TikTok", "YouTube"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlatform(p)}
                        className={`px-3 py-2 rounded-xl text-sm border transition ${
                          platform === p
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {p}
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
                    <ToolbarButton 
                      icon={ImageIcon} 
                      label="Ảnh" 
                      active={activeTools.has('image')} 
                      onClick={handleImageTool} 
                    />
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
                <Field label="Tiêu đề / Hook" required={true} hint="">
                  <input 
                    className="w-full border rounded-xl px-3 py-2" 
                    placeholder="Ví dụ: Siêu sale 9.9" 
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
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" onClick={autoCaption}>
                    <Sparkles className="w-4 h-4 mr-1" /> Gợi ý caption (AI)
                  </Button>
                  <Button variant="outline" onClick={autoHashtags}>
                    <Hash className="w-4 h-4 mr-1" /> Sinh hashtag
                  </Button>
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
                    userId={(session.user as any).id || 'demo-user'}
                    maxImages={4}
                    onImagesChange={setUploadedImages}
                    className="mt-2"
                  />
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
                  <Button 
                    variant="outline" 
                    onClick={suggestOptimalTime}
                    className="text-xs px-2 py-1"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Gợi ý thời gian
                  </Button>
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
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || uploadedImages.some(img => img.uploading)}
                  className={`px-6 py-2 font-medium transition-all flex items-center gap-2 ${
                    isSubmitting 
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
              
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 text-lg">⚠️</span>
                    <div>
                      <h4 className="text-red-800 font-medium mb-1">
                        Vui lòng kiểm tra lại:
                      </h4>
                      <ul className="text-red-700 text-sm space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
                </>
              )}

              {/* Video Form */}
              {activeTab === "video" && (
                <>
                  {/* Video Platform Selection */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["TikTok", "Instagram Reels", "YouTube Shorts", "Facebook Reels"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setVideoPlatform(p)}
                        className={`px-3 py-2 rounded-xl text-sm border transition ${
                          videoPlatform === p
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {p}
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
                    </div>
                    
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || uploadedImages.some(img => img.uploading)}
                      className={`px-6 py-2 font-medium transition-all flex items-center gap-2 ${
                        isSubmitting 
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
                  
                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500 text-lg">⚠️</span>
                        <div>
                          <h4 className="text-red-800 font-medium mb-1">
                            Vui lòng kiểm tra lại:
                          </h4>
                          <ul className="text-red-700 text-sm space-y-1">
                            {validationErrors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right: Preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => {}}>
                  <Smartphone className="w-4 h-4 mr-1" /> Mobile
                </Button>
                <Button variant="ghost" onClick={() => {}}>
                  <Tablet className="w-4 h-4 mr-1" /> Tablet
                </Button>
                <Button variant="ghost" onClick={() => {}}>
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

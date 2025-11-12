"use client";

import { useState, type JSX, type ReactNode } from "react";
import { Sparkles, Hash, Film, Target, Clock, Zap } from "lucide-react";
import { useAIRateLimit } from "@/hooks/useAIRateLimit";
import { useToast } from "@/components/ui/Toast";
import { buildAIContextFromComposeData } from "@/lib/utils/build-ai-context";
import { activityLogger } from "@/lib/services/activityLogger";

type AIActionKey = "caption" | "hashtags" | "script" | "hook" | "timeline";

type ComposeMetadata = {
  type?: "social" | "video";
  platform: string;
  ratio: string;
  hashtags?: string;
  cta?: string;
  brandColor?: string;
  template?: string;
  duration?: number;
  hook?: string;
  beats?: { time: number; text: string }[];
  sub?: string;
  overlayCTA?: string;
};

type ComposeData = {
  title: string;
  content: string;
  channels: string[];
  scheduleAt: string;
  mediaUrls: string[];
  postId?: string;
  aiContext?: string;
  metadata?: ComposeMetadata;
};

type LegacyAIAction = {
  key: AIActionKey;
  icon: ReactNode;
  label: string;
  description: string;
  loading?: boolean;
  disabled?: boolean;
};

interface ModernAIQuickActionsProps {
  composeData: Partial<ComposeData>;
  onDataChange: (data: Partial<ComposeData>) => void;
  activeTab: "social" | "video";
  onHashtagResult?: (validation: unknown, recommendations: string[]) => void;
}

interface LegacyAIQuickActionsProps {
  canUseAI: boolean;
  disabledMessage?: string;
  onAction: (action: AIActionKey) => Promise<void> | void;
  actions: LegacyAIAction[];
}

type AIQuickActionsProps = ModernAIQuickActionsProps | LegacyAIQuickActionsProps;

interface AIActionConfig {
  key: AIActionKey;
  label: string;
  description: string;
  icon: JSX.Element;
}

const SOCIAL_ACTIONS: AIActionConfig[] = [
  {
    key: "caption",
    label: "Tạo nội dung",
    description: "AI viết caption",
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    key: "hashtags",
    label: "Gợi ý hashtag",
    description: "Auto hashtags",
    icon: <Hash className="w-4 h-4" />,
  },
];

const VIDEO_ACTIONS: AIActionConfig[] = [
  {
    key: "script",
    label: "Tạo script video",
    description: "AI viết kịch bản",
    icon: <Film className="w-4 h-4" />,
  },
  {
    key: "hook",
    label: "Gợi ý hook",
    description: "Câu mở đầu thu hút",
    icon: <Target className="w-4 h-4" />,
  },
  {
    key: "timeline",
    label: "Chia timeline",
    description: "Phân chia thời lượng",
    icon: <Clock className="w-4 h-4" />,
  },
];

function ModernAIQuickActions({ composeData, onDataChange, activeTab, onHashtagResult }: ModernAIQuickActionsProps) {
  const { canUseAI, getAILimitMessage } = useAIRateLimit();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<AIActionKey | null>(null);

  const actions = activeTab === "video" ? VIDEO_ACTIONS : SOCIAL_ACTIONS;

  const handleAIAction = async (action: AIActionKey) => {
    if (!canUseAI()) {
      showToast({
        message: getAILimitMessage() || "Bạn đã vượt quá giới hạn AI hôm nay.",
        type: "warning",
        title: "Giới hạn AI",
      });
      return;
    }

    setLoadingAction(action);
    try {
      const platform = composeData.metadata?.platform?.toLowerCase().replace(" page", "") || "facebook";
      const title = composeData.title || "";
      const content = composeData.content || "";
      const aiContext = buildAIContextFromComposeData(composeData);

      let endpoint = "";
      let requestBody: Record<string, unknown> = {};

      switch (action) {
        case "caption":
          endpoint = "/api/ai/caption";
          requestBody = {
            platform,
            title,
            content,
            tone: "exciting",
            aiContext,
          };
          break;
        case "hashtags":
          endpoint = "/api/ai/hashtags";
          requestBody = {
            platform,
            title,
            content,
            aiContext,
            count: 10,
          };
          break;
        case "script":
          endpoint = "/api/ai/script";
          requestBody = {
            platform,
            title,
            content,
            duration: composeData.metadata?.duration || 30,
            tone: "engaging",
          };
          break;
        case "hook":
          endpoint = "/api/ai/script";
          requestBody = {
            platform,
            title,
            content,
            duration: composeData.metadata?.duration || 30,
            tone: "hook",
            mode: "hook",
          };
          break;
        case "timeline":
          endpoint = "/api/ai/script";
          requestBody = {
            platform,
            title,
            content,
            duration: composeData.metadata?.duration || 30,
            tone: "timeline",
            mode: "timeline",
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Không thể tạo nội dung AI");
      }

      const data = await response.json();

      if (action === "caption" && data.caption) {
        onDataChange({
          ...composeData,
          content: data.caption,
        });
        showToast({ message: "AI đã tạo caption", type: "success", title: "Tạo nội dung thành công" });
      }

      if (action === "hashtags" && data.hashtags) {
        const hashtagsValue = Array.isArray(data.hashtags)
          ? data.hashtags.join(" ")
          : String(data.hashtags);
        onDataChange({
          ...composeData,
          metadata: {
            platform: composeData.metadata?.platform || "Facebook Page",
            ratio: composeData.metadata?.ratio || "1:1",
            ...composeData.metadata,
            hashtags: hashtagsValue,
          },
        });
        showToast({ message: "AI đã gợi ý hashtags", type: "success", title: "Hashtag sẵn sàng" });
        const recommendationsList = Array.isArray(data.recommendations) ? data.recommendations : [];
        onHashtagResult?.(data.validation ?? null, recommendationsList);
      }

      if (action === "script" && data.script) {
        onDataChange({
          ...composeData,
          content: data.script,
        });
        showToast({ message: "AI đã tạo kịch bản", type: "success", title: "Script video" });
      }

      if (action === "hook" && data.hook) {
        onDataChange({
          ...composeData,
          metadata: {
            platform: composeData.metadata?.platform || "Facebook Page",
            ratio: composeData.metadata?.ratio || (activeTab === "video" ? "9:16" : "1:1"),
            ...composeData.metadata,
            hook: data.hook,
          },
        });
        showToast({ message: "AI đã gợi ý hook", type: "success", title: "Hook thu hút" });
      }

      if (action === "timeline" && data.timeline) {
        onDataChange({
          ...composeData,
          metadata: {
            platform: composeData.metadata?.platform || "Facebook Page",
            ratio: composeData.metadata?.ratio || (activeTab === "video" ? "9:16" : "1:1"),
            ...composeData.metadata,
            beats: data.timeline,
          },
        });
        showToast({ message: "AI đã chia timeline", type: "success", title: "Timeline video" });
      }

      await activityLogger.logAIUsage(action, platform, true);
    } catch (error) {
      console.error("AI action error:", error);

      await activityLogger.logAIUsage(
        action,
        composeData.metadata?.platform || "facebook",
        false,
        error instanceof Error ? error.message : "Unknown error",
      );

      showToast({
        message: error instanceof Error ? error.message : "Có lỗi xảy ra khi sử dụng AI",
        type: "error",
        title: "AI thất bại",
      });
    } finally {
      setLoadingAction(null);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 bg-white text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition-colors"
      >
        <Zap className="w-4 h-4" />
        AI trợ giúp
        <span className="text-xs text-indigo-400">{loadingAction ? "Đang chạy..." : ""}</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="p-3">
            <div className="text-xs text-gray-500 mb-2">
              {getAILimitMessage() || "Sử dụng AI để hoàn thiện nội dung nhanh hơn."}
            </div>
            <div className="space-y-2">
              {actions.map(action => {
                const disabled = !canUseAI() || (!!loadingAction && loadingAction !== action.key);
                const isLoading = loadingAction === action.key;

                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => handleAIAction(action.key)}
                    disabled={disabled}
                    className={`w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                      disabled
                        ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    <div className={`mt-0.5 ${isLoading ? "animate-spin" : "text-indigo-500"}`}>
                      {action.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{action.label}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegacyAIQuickActions({ canUseAI, disabledMessage, onAction, actions }: LegacyAIQuickActionsProps) {
  return (
    <div className="space-y-2">
      {disabledMessage && !canUseAI && (
        <div className="text-xs text-gray-500">{disabledMessage}</div>
      )}
      {actions.map(action => {
        const isDisabled = !canUseAI || action.disabled || action.loading;

        return (
          <button
            key={action.key}
            type="button"
            onClick={() => onAction(action.key)}
            disabled={isDisabled}
            className={`w-full p-3 border rounded-lg text-left transition-colors flex items-center gap-2 ${
              isDisabled
                ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
            }`}
          >
            <span className="text-lg" aria-hidden="true">
              {action.loading ? "⏳" : action.icon}
            </span>
            <div>
              <div className="text-sm font-medium text-gray-900">{action.label}</div>
              <div className="text-xs text-gray-500">{action.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function AIQuickActions(props: AIQuickActionsProps) {
  if ("composeData" in props) {
    return <ModernAIQuickActions {...props} />;
  }

  return <LegacyAIQuickActions {...props} />;
}

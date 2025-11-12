import type { AIContext } from '@/lib/services/gemini';

interface ComposeContextSource {
  title?: string;
  content?: string;
  channels?: string[];
  scheduleAt?: string;
  metadata?: {
    type?: 'social' | 'video';
    platform?: string;
    ratio?: string;
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
  aiContext?: string;
}

const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

function getSeasonalContext(now: Date): string {
  const month = now.getMonth() + 1;
  switch (month) {
    case 1:
    case 2:
      return 'Tết Nguyên Đán, mùa xuân, năm mới';
    case 3:
      return 'Mùa xuân, 8/3 Quốc tế Phụ nữ';
    case 4:
    case 5:
      return 'Mùa hè, kỳ nghỉ lễ 30/4 - 1/5';
    case 9:
      return 'Mùa khai giảng, Quốc khánh 2/9';
    case 10:
      return 'Mùa thu, 20/10 Ngày Phụ nữ Việt Nam';
    case 12:
      return 'Giáng sinh, cuối năm, mua sắm Tết';
    default:
      return '';
  }
}

function extractPreferredTimes(scheduleAt?: string): string[] | undefined {
  if (!scheduleAt) return undefined;
  if (!scheduleAt.includes('T')) return undefined;
  const [, timePart] = scheduleAt.split('T');
  if (!timePart) return undefined;
  return [timePart.slice(0, 5)];
}

export function buildAIContextFromComposeData(composeData: ComposeContextSource = {}): AIContext {
  const now = new Date();
  const seasonalContext = getSeasonalContext(now);

  const context: AIContext = {
    primaryGoal: composeData.metadata?.template?.includes('promo') || composeData.metadata?.template?.includes('sale')
      ? 'conversion'
      : composeData.metadata?.template?.includes('tips') || composeData.metadata?.template?.includes('tutorial')
      ? 'education'
      : 'engagement',
    seasonalContext,
    location: 'Việt Nam',
    productType: composeData.metadata?.type === 'video' ? 'Video content' : 'Social post',
    brandVoice: composeData.metadata?.cta?.toLowerCase().includes('ngay') ? 'urgent' : undefined,
    channels: composeData.channels,
    scheduleStartDate: composeData.scheduleAt ? new Date(composeData.scheduleAt).toISOString().split('T')[0] : undefined,
    scheduleEndDate: composeData.scheduleAt ? new Date(composeData.scheduleAt).toISOString().split('T')[0] : undefined,
    preferredPostingTimes: extractPreferredTimes(composeData.scheduleAt),
    preferredPostingTimezone: VIETNAM_TIMEZONE,
    keyMessages: composeData.metadata?.hashtags
      ? composeData.metadata.hashtags
          .split(/[\s#,]+/)
          .map(token => token.trim())
          .filter(Boolean)
      : undefined,
    manualNotes: composeData.aiContext?.trim() || undefined,
    campaignName: composeData.metadata?.template,
  };

  return Object.fromEntries(
    Object.entries(context).filter(([, value]) =>
      Array.isArray(value) ? value.length > 0 : value !== undefined && value !== ''
    )
  ) as AIContext;
}

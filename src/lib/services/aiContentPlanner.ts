import { generateContentPlanPrompt, type AIContext } from '@/lib/services/gemini';
import type {
  AIContentPlanResponse,
  AIContentPlanDay,
  AIContentPlanSlot,
  AIContentPlannerRequest,
  ExistingPostSummary,
} from '@/types/ai';

const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

function buildPlanPrompt(
  payload: AIContentPlannerRequest & { aiContext?: AIContext | Record<string, unknown> }
): string {
  const {
    campaignName,
    startDate,
    endDate,
    timezone = DEFAULT_TIMEZONE,
    cadencePerWeek,
    preferredPlatforms,
    preferredTimes,
    goals,
    brandVoice,
    targetAudience,
    keyMessages,
    avoidThemes,
    existingPosts,
    manualContext,
    aiContext,
    instructions,
  } = payload;

  const existingSummary = existingPosts
    ?.map((post, idx) => {
      const perf = post.performance;
      const perfSummary = perf
        ? ` (reach: ${perf.reach ?? 'n/a'}, engagement: ${perf.engagement ?? 'n/a'}, conversions: ${perf.conversions ?? perf.clicks ?? 'n/a'})`
        : '';
      return `${idx + 1}. ${post.platform} - ${post.postedAt}: "${post.content.slice(0, 120)}"${perfSummary}`;
    })
    .join('\n') || 'Không có';

  const aiContextSection = aiContext
    ? JSON.stringify(aiContext, null, 2)
    : 'Không có';

  const keyMessageList = keyMessages && keyMessages.length > 0
    ? keyMessages.join(', ')
    : 'Không có';

  const avoidThemesList = avoidThemes && avoidThemes.length > 0
    ? avoidThemes.join(', ')
    : 'Không có';

  const goalList = goals && goals.length > 0 ? goals.join(', ') : 'Tăng tương tác và xây dựng thương hiệu';

  const preferredTimeList = preferredTimes && preferredTimes.length > 0
    ? preferredTimes.join(', ')
    : 'Hãy chọn thời điểm tiếp cận tốt nhất cho người dùng Việt Nam';

  const notes = [manualContext, instructions].filter(Boolean).join('\n');

  return `
Bạn là một chuyên gia lập kế hoạch nội dung social media cho thị trường Việt Nam.

Hãy tạo kế hoạch nội dung chi tiết theo yêu cầu sau:
- Chiến dịch: ${campaignName || 'Không đặt tên' }
- Thời gian: ${startDate} đến ${endDate}
- Múi giờ: ${timezone}
- Cadence mong muốn: ${cadencePerWeek} bài mỗi tuần
- Kênh ưu tiên: ${preferredPlatforms.join(', ')}
- Khung giờ ưu tiên: ${preferredTimeList}
- Mục tiêu chiến dịch: ${goalList}
- Persona mục tiêu: ${targetAudience || 'Khách hàng Việt Nam chung'}
- Giọng thương hiệu: ${brandVoice || 'Thân thiện, chuyên nghiệp'}
- Key messages: ${keyMessageList}
- Chủ đề cần tránh: ${avoidThemesList}

Ngữ cảnh bổ sung người dùng cung cấp:
${notes || 'Không có'}

Ngữ cảnh hệ thống hiện có (JSON):
${aiContextSection}

Các bài viết đã đăng gần đây:
${existingSummary}

YÊU CẦU ĐẦU RA:
- Trả về JSON hợp lệ với cấu trúc:
{
  "plan": [
    {
      "date": "YYYY-MM-DD",
      "theme": "Chủ đề chính của ngày",
      "focus": "Insight hoặc mục tiêu",
      "slots": [
        {
          "platform": "facebook | instagram | zalo",
          "time": "HH:MM" (theo 24h, múi giờ ${timezone}),
          "angle": "Góc tiếp cận",
          "captionIdea": "Gợi ý nội dung/caption",
          "assets": ["Đề xuất nội dung media"],
          "recommendedHashtags": ["..."],
          "duplicateOf": [] (nếu giống bài cũ)
        }
      ]
    }
  ],
  "summary": "Tóm tắt kế hoạch",
  "recommendations": ["gợi ý bổ sung"],
  "duplicateWarnings": ["Cảnh báo trùng lặp"],
  "metadata": {
    "timezone": "${timezone}",
    "cadence": "${cadencePerWeek} bài/tuần",
    "campaignName": "${campaignName || ''}",
    "notes": "Các lưu ý quan trọng"
  }
}

- Lưu ý khi tạo nội dung:
  • Tất cả nội dung bằng tiếng Việt, phù hợp văn hóa Việt Nam.
  • Khuyến nghị thời gian đăng dựa trên thói quen người dùng Việt Nam.
  • Không trùng lặp nội dung với danh sách bài đã đăng (nếu bắt buộc dùng ý tưởng tương tự, hãy ghi chú trong duplicateOf).
  • **QUAN TRỌNG**: Đảm bảo kế hoạch đạt cadence ${cadencePerWeek} bài mỗi tuần.
  • **QUAN TRỌNG**: Phân bổ các bài đăng ĐỀU ra các ngày khác nhau trong khoảng thời gian từ ${startDate} đến ${endDate}.
  • **QUAN TRỌNG**: KHÔNG tạo tất cả các bài cho cùng 1 ngày. Mỗi ngày trong "plan" array PHẢI có "date" khác nhau.
  • **QUAN TRỌNG**: Nếu cadence là 3 bài/tuần và khoảng thời gian là 7 ngày, hãy tạo kế hoạch như sau:
    - Thứ 2 (${startDate}): 1 bài
    - Thứ 4: 1 bài  
    - Thứ 6: 1 bài
  • Kết hợp các CTA đa dạng, tránh lặp từ.
  • Luôn đề xuất ít nhất một gợi ý hashtag cho mỗi slot.
  
**VÍ DỤ KẾT QUẢ ĐÚNG** (cadence 3 bài/tuần, 7 ngày):
{
  "plan": [
    { "date": "2025-11-24", "slots": [...] },
    { "date": "2025-11-26", "slots": [...] },
    { "date": "2025-11-28", "slots": [...] }
  ]
}

**SAI**: Không được tạo tất cả bài cho cùng 1 ngày như:
{
  "plan": [
    { "date": "2025-11-24", "slots": [slot1, slot2, slot3] }
  ]
}
`;
}

function ensureArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function parsePlan(raw: string): AIContentPlanResponse {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Gemini không trả về JSON hợp lệ.');
  }

  let parsed: Partial<AIContentPlanResponse>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse content plan JSON:', raw);
    throw new Error('Không thể phân tích kế hoạch AI trả về.');
  }

  const planDays = ensureArray(parsed.plan).map((day: any): AIContentPlanDay => ({
    date: day.date,
    theme: day.theme || '',
    focus: day.focus || '',
    slots: ensureArray(day.slots).map((slot: any): AIContentPlanSlot => ({
      platform: slot.platform,
      time: slot.time,
      angle: slot.angle || slot.theme || '',
      captionIdea: slot.captionIdea || slot.caption || '',
      assets: ensureArray(slot.assets),
      recommendedHashtags: ensureArray(slot.recommendedHashtags),
      duplicateOf: ensureArray(slot.duplicateOf),
    })),
  }));

  return {
    plan: planDays,
    summary: parsed.summary || '',
    recommendations: ensureArray(parsed.recommendations),
    duplicateWarnings: ensureArray(parsed.duplicateWarnings),
    metadata: parsed.metadata,
  };
}

function normalizeText(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function similarityScore(a: string, b: string): number {
  const tokensA = new Set(normalizeText(a));
  const tokensB = new Set(normalizeText(b));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  const intersection = [...tokensA].filter(token => tokensB.has(token)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}

function detectDuplicates(
  plan: AIContentPlanResponse,
  existingPosts: ExistingPostSummary[] | undefined
): AIContentPlanResponse {
  if (!existingPosts || existingPosts.length === 0) return plan;

  const warnings: string[] = plan.duplicateWarnings ? [...plan.duplicateWarnings] : [];

  plan.plan.forEach(day => {
    day.slots.forEach(slot => {
      existingPosts.forEach(post => {
        const score = similarityScore(slot.captionIdea, post.content);
        if (score >= 0.55) {
          const ref = post.id || `${post.platform}-${post.postedAt}`;
          if (!slot.duplicateOf) {
            slot.duplicateOf = [];
          }
          if (!slot.duplicateOf.includes(ref)) {
            slot.duplicateOf.push(ref);
          }
          const warningText = `Chủ đề ${day.date} (${slot.platform} ${slot.time}) tương tự bài ${ref} (điểm tương đồng ${(score * 100).toFixed(0)}%)`;
          if (!warnings.includes(warningText)) {
            warnings.push(warningText);
          }
        }
      });
    });
  });

  return {
    ...plan,
    duplicateWarnings: warnings,
  };
}

export async function createContentPlan(
  payload: AIContentPlannerRequest & { aiContext?: AIContext | Record<string, unknown> }
): Promise<AIContentPlanResponse> {
  const prompt = buildPlanPrompt(payload);
  const raw = await generateContentPlanPrompt(prompt, {
    maxOutputTokens: 3072,
    temperature: 0.6,
    topK: 32,
    topP: 0.85,
  });

  const parsedPlan = parsePlan(raw);
  return detectDuplicates(parsedPlan, payload.existingPosts);
}

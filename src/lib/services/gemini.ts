import { GoogleGenerativeAI } from '@google/generative-ai';
import { formatSocialContent } from '@/lib/utils/format-social-content';

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use Gemini 2.0 Flash-Lite for lowest cost ($0.075 input, $0.30 output per 1M tokens)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

export interface GeminiConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
}

export interface AIContext {
  // Business context
  category?: string;
  businessType?: string;
  brandVoice?: string;
  primaryGoal?: 'awareness' | 'engagement' | 'conversion' | 'education';
  
  // Audience context
  targetAge?: string;
  targetInterests?: string[];
  targetAudience?: string;
  location?: string;
  
  // Content context
  previousPosts?: Array<{
    content: string;
    engagement: number;
    platform: string;
  }>;
  currentTrends?: string[];
  seasonalContext?: string;
  competitorInsights?: string;
  
  // Product/Service context
  productType?: string;
  features?: string[];
  benefits?: string[];
  price?: string;
  promotion?: string;
}

const defaultConfig: GeminiConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 1024,
};

/**
 * Generate content caption for social media posts with rich context
 */
export async function generateCaption(params: {
  platform: 'instagram' | 'facebook' | 'tiktok' | 'zalo';
  title: string;
  content?: string;
  tone?: 'professional' | 'casual' | 'exciting' | 'promotional';
  aiContext?: AIContext;
  config?: GeminiConfig;
}): Promise<string> {
  const { platform, title, content, tone = 'exciting', aiContext = {}, config = defaultConfig } = params;
  
  const platformSpecs = {
    instagram: {
      maxLength: 2200,
      style: 'visual-focused, hashtag-friendly, emojis',
      format: 'Hook + description + call-to-action + hashtags'
    },
    facebook: {
      maxLength: 63206,
      style: 'conversational, engaging, community-focused',
      format: 'Story-telling approach with clear call-to-action'
    },
    tiktok: {
      maxLength: 300,
      style: 'trending, energetic, viral-potential',
      format: 'Short, catchy, with trending hashtags'
    },
    zalo: {
      maxLength: 1000,
      style: 'professional, informative, Vietnamese-focused',
      format: 'Clear message with business tone'
    }
  };

  const spec = platformSpecs[platform];
  
  // Build rich context prompt
  let contextSection = '';
  
  if (aiContext.category || aiContext.businessType) {
    contextSection += `\n**Bối cảnh doanh nghiệp:**`;
    if (aiContext.category) contextSection += `\n- Ngành: ${aiContext.category}`;
    if (aiContext.businessType) contextSection += `\n- Loại hình: ${aiContext.businessType}`;
    if (aiContext.brandVoice) contextSection += `\n- Giọng điệu thương hiệu: ${aiContext.brandVoice}`;
    if (aiContext.primaryGoal) contextSection += `\n- Mục tiêu chính: ${aiContext.primaryGoal}`;
  }
  
  if (aiContext.targetAge || aiContext.targetInterests?.length || aiContext.location) {
    contextSection += `\n\n**Đối tượng khách hàng:**`;
    if (aiContext.targetAge) contextSection += `\n- Độ tuổi: ${aiContext.targetAge}`;
    if (aiContext.targetInterests?.length) contextSection += `\n- Sở thích: ${aiContext.targetInterests.join(', ')}`;
    if (aiContext.targetAudience) contextSection += `\n- Nhóm khách hàng: ${aiContext.targetAudience}`;
    if (aiContext.location) contextSection += `\n- Vị trí: ${aiContext.location}`;
  }
  
  if (aiContext.features?.length || aiContext.benefits?.length || aiContext.price || aiContext.promotion) {
    contextSection += `\n\n**Thông tin sản phẩm/dịch vụ:**`;
    if (aiContext.productType) contextSection += `\n- Loại: ${aiContext.productType}`;
    if (aiContext.features?.length) contextSection += `\n- Tính năng nổi bật: ${aiContext.features.join(', ')}`;
    if (aiContext.benefits?.length) contextSection += `\n- Lợi ích: ${aiContext.benefits.join(', ')}`;
    if (aiContext.price) contextSection += `\n- Giá: ${aiContext.price}`;
    if (aiContext.promotion) contextSection += `\n- Khuyến mãi: ${aiContext.promotion}`;
  }
  
  if (aiContext.previousPosts?.length) {
    const topPosts = aiContext.previousPosts
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 3);
    
    contextSection += `\n\n**Bài đăng hiệu quả trước đây:**`;
    topPosts.forEach((post, idx) => {
      contextSection += `\n${idx + 1}. "${post.content.substring(0, 100)}..." (${post.engagement} tương tác trên ${post.platform})`;
    });
  }
  
  if (aiContext.currentTrends?.length) {
    contextSection += `\n\n**Xu hướng hiện tại:**`;
    aiContext.currentTrends.forEach(trend => {
      contextSection += `\n- ${trend}`;
    });
  }
  
  if (aiContext.seasonalContext) {
    contextSection += `\n\n**Bối cảnh thời điểm:** ${aiContext.seasonalContext}`;
  }
  
  if (aiContext.competitorInsights) {
    contextSection += `\n\n**Phân tích đối thủ:** ${aiContext.competitorInsights}`;
  }
  
  const prompt = `
Tạo caption cho bài đăng ${platform.toUpperCase()} với thông tin sau:

**Thông tin sản phẩm/nội dung:**
- Tiêu đề: ${title}
${content ? `- Mô tả: ${content}` : ''}
${contextSection}

**Yêu cầu cho ${platform}:**
- Độ dài tối đa: ${spec.maxLength} ký tự
- Phong cách: ${spec.style}
- Định dạng: ${spec.format}
- Tone: ${tone}
- Sử dụng tiếng Việt
- Phù hợp với thị trường Việt Nam

**QUAN TRỌNG - Định dạng văn bản:**
- KHÔNG sử dụng Markdown (không dùng **, __, ##, *, _, >, \`, etc.)
- Sử dụng text thuần (plain text) với emoji và line breaks
- Phần tiêu đề/heading: Viết HOA toàn bộ hoặc dùng emoji nổi bật
- Nhấn mạnh: Dùng VIẾT HOA hoặc emoji thay vì bold/italic
- Danh sách: Dùng emoji (✓, •, 👉, ➡️) thay vì dấu - hoặc *
- Ngắt dòng: Sử dụng tự nhiên để dễ đọc

**Ví dụ định dạng đúng:**
🎉 KHUYẾN MÃI ĐẶC BIỆT

Chào cả nhà! Hôm nay tớ có một món quà cực kỳ đặc biệt muốn chia sẻ với mọi người! 🎁

✓ Giảm giá lên đến 50%
✓ Freeship toàn quốc
✓ Tặng kèm quà tặng giá trị

Đừng bỏ lỡ cơ hội này nhé! 💝

**Lưu ý đặc biệt:**
- Tạo nội dung hấp dẫn, dễ đọc, PHÙ HỢP với context đã cung cấp
- Sử dụng emoji phù hợp (nhưng đừng quá nhiều)
- Có call-to-action rõ ràng
- Hashtags trending và phù hợp (nếu phù hợp với platform)
${aiContext.previousPosts?.length ? '- Học hỏi từ các bài đăng hiệu quả trước đây' : ''}
${aiContext.currentTrends?.length ? '- Tận dụng xu hướng hiện tại' : ''}
${aiContext.seasonalContext ? '- Kết hợp yếu tố thời điểm/mùa vụ' : ''}

Trả về chỉ nội dung caption dạng plain text, không có markdown, không có giải thích thêm.
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: config,
    });

    const response = await result.response;
    let text = response.text();
    
    // Clean up and format the text
    text = text.trim();
    
    // Safety check: If AI still returns markdown, convert it
    text = formatSocialContent(text, platform);
    
    return text;
  } catch (error) {
    console.error('Gemini caption generation error:', error);
    throw new Error('Không thể tạo caption. Vui lòng thử lại.');
  }
}

/**
 * Generate hashtags for social media posts with rich context
 */
export async function generateHashtags(params: {
  platform: 'instagram' | 'facebook' | 'tiktok' | 'zalo';
  title: string;
  content?: string;
  aiContext?: AIContext;
  count?: number;
  config?: GeminiConfig;
}): Promise<string[]> {
  const { platform, title, content, aiContext = {}, count = 10, config = defaultConfig } = params;

  // Build context section
  let contextSection = '';
  
  if (aiContext.category) contextSection += `\n- Ngành: ${aiContext.category}`;
  if (aiContext.productType) contextSection += `\n- Loại sản phẩm: ${aiContext.productType}`;
  if (aiContext.targetAudience) contextSection += `\n- Đối tượng: ${aiContext.targetAudience}`;
  if (aiContext.location) contextSection += `\n- Vị trí: ${aiContext.location}`;
  if (aiContext.currentTrends?.length) {
    contextSection += `\n- Xu hướng: ${aiContext.currentTrends.join(', ')}`;
  }

  const prompt = `
Tạo ${count} hashtags phù hợp cho bài đăng ${platform.toUpperCase()} với thông tin:

**Nội dung:**
- Tiêu đề: ${title}
${content ? `- Mô tả: ${content}` : ''}
${contextSection}

**Yêu cầu:**
- ${count} hashtags phù hợp nhất
- Kết hợp hashtags trending và niche
- Phù hợp với thị trường Việt Nam
- Bao gồm cả tiếng Việt và tiếng Anh
- Tối ưu cho ${platform}
${aiContext.currentTrends?.length ? '- Tận dụng xu hướng hiện tại' : ''}
${aiContext.category ? `- Liên quan đến ngành ${aiContext.category}` : ''}

**Định dạng trả về:**
Trả về danh sách hashtags, mỗi hashtag một dòng, bắt đầu bằng #

Ví dụ:
#sale
#deal
#vietnam
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: config,
    });

    const response = await result.response;
    const text = response.text();
    
    // Parse hashtags from response
    const hashtags = text
      .split('\n')
      .filter((line: string) => line.trim().startsWith('#'))
      .map((line: string) => line.trim())
      .slice(0, count);
    
    return hashtags;
  } catch (error) {
    console.error('Gemini hashtags generation error:', error);
    throw new Error('Không thể tạo hashtags. Vui lòng thử lại.');
  }
}

/**
 * Generate video script for TikTok/YouTube Shorts
 */
export async function generateVideoScript(params: {
  platform: 'tiktok' | 'youtube' | 'instagram';
  duration: number; // seconds
  title: string;
  content?: string;
  style?: 'educational' | 'entertainment' | 'promotional' | 'storytelling';
  config?: GeminiConfig;
}): Promise<{
  hook: string;
  beats: { time: number; text: string; action?: string }[];
  cta: string;
}> {
  const { platform, duration, title, content, style = 'promotional', config = defaultConfig } = params;

  const prompt = `
Tạo script video ${duration} giây cho ${platform.toUpperCase()} với thông tin:

**Thông tin video:**
- Tiêu đề: ${title}
${content ? `- Nội dung: ${content}` : ''}
- Thời lượng: ${duration} giây
- Phong cách: ${style}
- Platform: ${platform}

**Yêu cầu cấu trúc script:**
1. Hook (0-3s): Câu mở đầu hấp dẫn, gây tò mò
2. Beats: Chia nhỏ thành các đoạn theo thời gian
3. CTA: Call-to-action cuối video

**Định dạng trả về JSON:**
{
  "hook": "Câu hook hấp dẫn",
  "beats": [
    {"time": 0, "text": "Nội dung đoạn 1", "action": "Hành động camera/edit"},
    {"time": 3, "text": "Nội dung đoạn 2", "action": "Hành động camera/edit"},
    ...
  ],
  "cta": "Call-to-action cuối video"
}

**Lưu ý:**
- Phù hợp với thị trường Việt Nam
- Ngôn ngữ trẻ trung, dễ hiểu
- Tạo điểm nhấn ở giây đầu tiên
- CTA rõ ràng, thúc đẩy hành động
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: config,
    });

    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Gemini');
    }
    
    const scriptData = JSON.parse(jsonMatch[0]);
    return scriptData;
  } catch (error) {
    console.error('Gemini script generation error:', error);
    throw new Error('Không thể tạo script video. Vui lòng thử lại.');
  }
}

/**
 * Suggest optimal posting times based on content and audience
 */
export async function suggestOptimalTimes(params: {
  platform: string[];
  contentType: 'promotional' | 'educational' | 'entertainment' | 'news';
  targetAudience: 'teens' | 'adults' | 'professionals' | 'general';
  timezone?: string;
  config?: GeminiConfig;
}): Promise<{
  suggestions: {
    platform: string;
    times: string[];
    reasoning: string;
  }[];
}> {
  const { platform, contentType, targetAudience, timezone = 'Asia/Ho_Chi_Minh', config = defaultConfig } = params;

  const prompt = `
Gợi ý thời gian đăng bài tối ưu cho các platform social media với thông tin:

**Thông tin:**
- Platforms: ${platform.join(', ')}
- Loại nội dung: ${contentType}
- Đối tượng: ${targetAudience}
- Múi giờ: ${timezone}

**Yêu cầu:**
- Dựa trên thói quen sử dụng social media của người Việt Nam
- Xem xét đặc điểm từng platform
- Phân tích theo nhóm đối tượng
- Đưa ra 3-5 khung giờ tốt nhất cho mỗi platform

**Định dạng trả về JSON:**
{
  "suggestions": [
    {
      "platform": "instagram",
      "times": ["09:00", "13:00", "19:00"],
      "reasoning": "Lý do tại sao chọn những khung giờ này"
    }
  ]
}

Lưu ý: Sử dụng định dạng 24h (HH:MM) cho thời gian.
`;

  try {
    console.log('🔄 Sending optimal times request to Gemini...');
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: config,
    });

    const response = await result.response;
    const text = response.text();
    
    console.log('📝 Gemini optimal times raw response:', text);
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in response:', text);
      throw new Error('Invalid JSON response from Gemini');
    }
    
    console.log('🔍 Extracted JSON:', jsonMatch[0]);
    
    const suggestions = JSON.parse(jsonMatch[0]);
    console.log('✅ Parsed suggestions:', suggestions);
    
    return suggestions;
  } catch (error) {
    console.error('❌ Gemini optimal times suggestion error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      error
    });
    throw new Error('Không thể gợi ý thời gian tối ưu. Vui lòng thử lại.');
  }
}

/**
 * Health check for Gemini service
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      generationConfig: { maxOutputTokens: 10 },
    });
    
    await result.response;
    return true;
  } catch (error) {
    console.error('Gemini health check failed:', error);
    return false;
  }
}

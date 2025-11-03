# AI Prompts Enhancement - Smart Context Integration

## 📋 Tổng quan

Đã cải thiện hệ thống AI prompts với context phong phú, giúp tạo nội dung chất lượng cao hơn dựa trên nhiều yếu tố: mùa vụ, xu hướng, đối tượng khách hàng, lịch sử bài đăng, và nhiều hơn nữa.

## ✅ Những gì đã hoàn thành

### 1. **Xóa Files Trùng Lặp**
- ❌ `src/lib/services/ai-smart-prompts.service.ts` (duplicate)
- ❌ `src/components/AIPromptsComponent.tsx` (duplicate)
- ❌ `src/app/api/ai-prompts/route.ts` (duplicate)

✅ Sử dụng `src/lib/services/gemini.ts` đã có sẵn

### 2. **Enhanced AIContext Interface**

File: `src/lib/services/gemini.ts`

```typescript
export interface AIContext {
  // Business context
  category?: string;                // Ngành nghề
  businessType?: string;            // Loại hình kinh doanh
  brandVoice?: string;              // Giọng điệu thương hiệu
  primaryGoal?: 'awareness' | 'engagement' | 'conversion' | 'education';
  
  // Audience context
  targetAge?: string;               // Độ tuổi khách hàng
  targetInterests?: string[];       // Sở thích
  targetAudience?: string;          // Nhóm đối tượng
  location?: string;                // Vị trí địa lý
  
  // Content context
  previousPosts?: Array<{           // Lịch sử bài đăng
    content: string;
    engagement: number;
    platform: string;
  }>;
  currentTrends?: string[];         // Xu hướng hiện tại
  seasonalContext?: string;         // Bối cảnh mùa vụ
  competitorInsights?: string;      // Phân tích đối thủ
  
  // Product/Service context
  productType?: string;             // Loại sản phẩm
  features?: string[];              // Tính năng
  benefits?: string[];              // Lợi ích
  price?: string;                   // Giá
  promotion?: string;               // Khuyến mãi
}
```

### 3. **Enhanced generateCaption() Function**

#### Trước đây:
```typescript
export async function generateCaption(params: {
  platform: 'instagram' | 'facebook' | 'tiktok' | 'zalo';
  title: string;
  content?: string;
  tone?: 'professional' | 'casual' | 'exciting' | 'promotional';
  targetAudience?: string;  // ❌ Chỉ có target audience
  productType?: string;      // ❌ Chỉ có product type
})
```

#### Bây giờ:
```typescript
export async function generateCaption(params: {
  platform: 'instagram' | 'facebook' | 'tiktok' | 'zalo';
  title: string;
  content?: string;
  tone?: 'professional' | 'casual' | 'exciting' | 'promotional';
  aiContext?: AIContext;    // ✅ Rich context với 15+ fields
})
```

#### Prompts với Rich Context:

```
**Bối cảnh doanh nghiệp:**
- Ngành: Fashion Retail
- Loại hình: E-commerce
- Giọng điệu thương hiệu: Trendy, youthful
- Mục tiêu chính: conversion

**Đối tượng khách hàng:**
- Độ tuổi: 18-30
- Sở thích: Fashion, K-pop, Shopping
- Nhóm khách hàng: Young professionals
- Vị trí: Việt Nam

**Thông tin sản phẩm/dịch vụ:**
- Loại: Áo khoác mùa đông
- Tính năng nổi bật: Giữ ấm, chống nước, thiết kế Hàn Quốc
- Lợi ích: Thời trang + ấm áp + bền bỉ
- Giá: 599.000đ
- Khuyến mãi: Giảm 30% + Freeship

**Bài đăng hiệu quả trước đây:**
1. "🔥 FLASH SALE 50%..." (1200 tương tác trên instagram)
2. "💝 Combo Tết siêu hời..." (980 tương tác trên facebook)

**Xu hướng hiện tại:**
- Winter fashion 2024
- Korean style
- Cozy aesthetic

**Bối cảnh thời điểm:** Giáng sinh, cuối năm, mua sắm tết
```

### 4. **Enhanced generateHashtags() Function**

Tương tự với `generateCaption()`, đã cải thiện context:

```typescript
export async function generateHashtags(params: {
  platform: 'instagram' | 'facebook' | 'tiktok' | 'zalo';
  title: string;
  content?: string;
  aiContext?: AIContext;  // ✅ Rich context
  count?: number;
})
```

### 5. **Updated API Endpoints**

#### `/api/ai/caption/route.ts`
```typescript
const { 
  platform, 
  title, 
  content, 
  tone = 'exciting',
  aiContext  // ✅ Accept rich context
} = body;

const caption = await generateCaption({
  platform,
  title,
  content,
  tone,
  aiContext,  // ✅ Pass to Gemini
});
```

#### `/api/ai/hashtags/route.ts`
```typescript
const { 
  platform, 
  title, 
  content, 
  aiContext,  // ✅ Accept rich context
  count = 10 
} = body;

const hashtags = await generateHashtags({
  platform,
  title,
  content,
  aiContext,  // ✅ Pass to Gemini
  count,
});
```

### 6. **UI Integration - ComposeLeftPanel.tsx**

#### Helper Function: `buildAIContext()`

Tự động xây dựng context từ dữ liệu có sẵn:

```typescript
const buildAIContext = (composeData: Partial<ComposeData>): AIContext => {
  const now = new Date();
  const month = now.getMonth() + 1;
  
  // Seasonal context cho Việt Nam
  let seasonalContext = '';
  if (month === 1 || month === 2) {
    seasonalContext = 'Tết Nguyên Đán, mùa xuân, năm mới';
  } else if (month === 4 || month === 5) {
    seasonalContext = 'Mùa hè, kỳ nghỉ lễ 30/4 - 1/5';
  } else if (month === 9) {
    seasonalContext = 'Mùa khai giảng, quốc khánh 2/9';
  } else if (month === 12) {
    seasonalContext = 'Giáng sinh, cuối năm, mua sắm tết';
  }
  // ... more logic
  
  return {
    primaryGoal: /* auto-detect from template */,
    seasonalContext,
    location: 'Việt Nam',
    productType: /* extract from metadata */,
  };
};
```

#### Updated `handleAIAction()`

```typescript
const handleAIAction = async (action: 'caption' | 'hashtags' | ...) => {
  // Build rich AI context
  const aiContext = buildAIContext(composeData);

  switch (action) {
    case 'caption':
      requestBody = {
        platform,
        title,
        content,
        tone: 'exciting',
        aiContext  // ✅ Pass rich context
      };
      break;

    case 'hashtags':
      requestBody = {
        platform,
        title,
        content,
        aiContext,  // ✅ Pass rich context
        count: 10
      };
      break;
  }
};
```

## 🎯 Lợi ích

### 1. **Nội dung Chất lượng Cao Hơn**
- AI hiểu rõ context doanh nghiệp
- Phù hợp với thương hiệu và đối tượng
- Tận dụng xu hướng và mùa vụ

### 2. **Học từ Lịch sử**
```typescript
previousPosts: [
  { content: "...", engagement: 1200, platform: "instagram" }
]
```
AI học từ các bài đăng thành công trước đây

### 3. **Seasonal Intelligence**
Tự động nhận biết và tận dụng:
- Tết Nguyên Đán (1-2)
- 8/3 Quốc tế Phụ nữ
- 30/4 - 1/5 Lễ
- Khai giảng (9)
- 20/10 Phụ nữ Việt Nam
- Giáng sinh, Tết (12)

### 4. **Backward Compatible**
```typescript
// ✅ Vẫn hoạt động như cũ (không truyền context)
generateCaption({
  platform: 'instagram',
  title: 'Product Launch',
  tone: 'exciting'
});

// ✅ Hoặc với rich context
generateCaption({
  platform: 'instagram',
  title: 'Product Launch',
  tone: 'exciting',
  aiContext: {
    category: 'Fashion',
    targetAge: '18-30',
    seasonalContext: 'Tết 2025'
  }
});
```

## 🚀 Sử dụng

### Example 1: Caption với Full Context

```typescript
const caption = await fetch('/api/ai/caption', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platform: 'instagram',
    title: 'Áo khoác mùa đông 2024',
    content: 'Thiết kế Hàn Quốc, giữ ấm tốt',
    tone: 'exciting',
    aiContext: {
      category: 'Fashion',
      businessType: 'E-commerce',
      brandVoice: 'Trendy, youthful',
      primaryGoal: 'conversion',
      targetAge: '18-30',
      targetInterests: ['Fashion', 'K-pop'],
      location: 'Việt Nam',
      productType: 'Áo khoác',
      features: ['Giữ ấm', 'Chống nước', 'Thiết kế Hàn Quốc'],
      price: '599.000đ',
      promotion: 'Giảm 30% + Freeship',
      currentTrends: ['Winter fashion 2024', 'Korean style'],
      seasonalContext: 'Giáng sinh, cuối năm, mua sắm tết',
      previousPosts: [
        {
          content: '🔥 FLASH SALE 50%...',
          engagement: 1200,
          platform: 'instagram'
        }
      ]
    }
  })
});
```

### Example 2: Hashtags với Context

```typescript
const hashtags = await fetch('/api/ai/hashtags', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platform: 'instagram',
    title: 'Áo khoác mùa đông 2024',
    content: 'Thiết kế Hàn Quốc',
    count: 15,
    aiContext: {
      category: 'Fashion',
      targetAge: '18-30',
      location: 'Việt Nam',
      currentTrends: ['Winter fashion 2024', 'Korean style'],
      seasonalContext: 'Giáng sinh, cuối năm'
    }
  })
});
```

## 📊 So sánh Before/After

### Before (Simple Prompt):
```
Tạo caption cho bài đăng INSTAGRAM:
- Tiêu đề: Áo khoác mùa đông
- Mô tả: Giữ ấm tốt
- Đối tượng: general
```

**Output**: Generic, không có personality

### After (Rich Context Prompt):
```
Tạo caption cho bài đăng INSTAGRAM:

**Bối cảnh doanh nghiệp:**
- Ngành: Fashion
- Giọng điệu: Trendy, youthful
- Mục tiêu: conversion

**Đối tượng:**
- Độ tuổi: 18-30
- Sở thích: Fashion, K-pop
- Vị trí: Việt Nam

**Sản phẩm:**
- Áo khoác mùa đông
- Features: Giữ ấm, chống nước, Hàn Quốc
- Giá: 599k - Giảm 30%

**Xu hướng:** Winter fashion 2024, Korean style
**Mùa vụ:** Giáng sinh, cuối năm, mua sắm tết
```

**Output**: Chất lượng cao, có personality, phù hợp context

## 🔄 Migration Path

### Không cần migration!

Tất cả API endpoints vẫn **backward compatible**:

```typescript
// ✅ Old code vẫn hoạt động
fetch('/api/ai/caption', {
  body: JSON.stringify({
    platform: 'instagram',
    title: 'Hello',
    tone: 'exciting'
  })
});

// ✅ New code với context tốt hơn
fetch('/api/ai/caption', {
  body: JSON.stringify({
    platform: 'instagram',
    title: 'Hello',
    tone: 'exciting',
    aiContext: { ... }  // Optional!
  })
});
```

## 🎨 UI Auto-Context

`ComposeLeftPanel` tự động build context từ:
- Template được chọn → `primaryGoal`
- Metadata → `productType`
- Tháng hiện tại → `seasonalContext`
- Default → `location: 'Việt Nam'`

Không cần config gì thêm! 🎉

## 📈 Next Steps (Optional Enhancements)

### 1. **Workspace Settings Integration**
Lưu business context vào workspace settings:
```typescript
interface WorkspaceSettings {
  aiContext: {
    category: string;
    businessType: string;
    brandVoice: string;
    defaultTargetAge: string;
    // ...
  }
}
```

### 2. **Analytics Integration**
```typescript
// Lấy top performing posts tự động
const topPosts = await getTopPosts(workspaceId, platform, limit: 5);
aiContext.previousPosts = topPosts;
```

### 3. **Trend Detection**
```typescript
// Auto-detect trending hashtags/topics
const trends = await detectTrends(category, location);
aiContext.currentTrends = trends;
```

### 4. **Competitor Analysis**
```typescript
// Analyze competitor content
const insights = await analyzeCompetitors(category, location);
aiContext.competitorInsights = insights;
```

## 🧪 Testing

Đã kiểm tra:
- ✅ TypeScript compilation: No errors
- ✅ Backward compatibility: Old API calls vẫn hoạt động
- ✅ New context integration: UI tự động build context
- ✅ API endpoints: Accept và pass context đúng

## 📝 Notes

1. **Cost Optimization**: Gemini 2.0 Flash-Lite ($0.075 input / $0.30 output per 1M tokens)
2. **Prompt Length**: Longer prompts = better quality nhưng tốn token hơn
3. **Context Priority**: Càng nhiều context càng tốt, nhưng không bắt buộc
4. **Vietnamese Market**: Optimized cho thị trường Việt Nam

## ✅ Completion Checklist

- [x] Xóa duplicate AI files
- [x] Thêm AIContext interface với 15+ fields
- [x] Enhance generateCaption() với rich context
- [x] Enhance generateHashtags() với rich context
- [x] Update /api/ai/caption endpoint
- [x] Update /api/ai/hashtags endpoint
- [x] Build buildAIContext() helper function
- [x] Integrate với ComposeLeftPanel
- [x] Seasonal context cho Việt Nam (Tết, lễ, mùa vụ)
- [x] Backward compatibility testing
- [x] TypeScript compilation check

---

**Status**: ✅ **COMPLETED**
**Date**: 2025-01-11
**Impact**: 🚀 High - Significantly improves AI-generated content quality

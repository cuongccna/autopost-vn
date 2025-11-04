# 🏷️ Smart Hashtag Intelligence System

## 📋 Vấn đề hiện tại

AI tạo hashtags **KHÔNG kiểm chứng**:
- ❌ Không biết hashtag trending hay không
- ❌ Không biết volume (số bài posts)
- ❌ Không biết competition level
- ❌ Không track performance

## ✨ Giải pháp đề xuất

### Level 1: Hashtag Validation (Cơ bản - Miễn phí)
**API:** Không cần external API
**Cách thức:** Rule-based validation

**Features:**
1. **Format Check:**
   - Loại bỏ khoảng trắng
   - Giới hạn độ dài (Instagram: max 30 chars)
   - Không cho phép ký tự đặc biệt

2. **Platform-Specific Rules:**
   - Instagram: Suggest 9-15 hashtags
   - Facebook: Warning nếu >3 hashtags
   - TikTok: Yêu cầu ít nhất 3 trending hashtags
   - Zalo: Warning hashtag không hỗ trợ

3. **Banned Hashtags Check:**
   - Danh sách shadowban hashtags (Instagram)
   - Hashtags vi phạm chính sách

### Level 2: Hashtag Analytics (Trung bình - External API)
**API Options:**

#### Option 1: RapidAPI - Instagram Hashtag Data
- **URL:** https://rapidapi.com/restyler/api/hashtag-finder
- **Cost:** Free tier: 100 requests/day
- **Data:** Volume, related hashtags, difficulty score

#### Option 2: Hashatit API
- **URL:** https://hashatit.com/api
- **Cost:** $9/month for 10K requests
- **Data:** Real-time trending, volume, engagement rate

**Features:**
1. **Volume Analysis:**
   ```
   #sale → 50M posts (Quá cạnh tranh ⚠️)
   #salevietnam → 10K posts (Tốt ✅)
   ```

2. **Competition Score:**
   - Low (< 10K): Dễ reach
   - Medium (10K-100K): Moderate
   - High (>1M): Khó cạnh tranh

3. **Related Hashtags:**
   - Suggest alternative hashtags ít cạnh tranh hơn

### Level 3: AI-Powered Performance Tracking (Nâng cao)
**Tự build internal system**

**Features:**
1. **Performance History:**
   - Track hashtags nào đã dùng
   - Measure engagement rate per hashtag
   - A/B testing hashtag sets

2. **Smart Recommendations:**
   - Học từ bài posts thành công
   - Suggest hashtags dựa trên historical data

3. **Seasonal Trends:**
   - Tết, Black Friday, 8/3, 20/10
   - Auto-suggest seasonal hashtags

---

## 🔧 Implementation Plan

### Phase 1: Basic Validation (1-2 giờ)
**File:** `src/lib/services/hashtag-validator.ts`

```typescript
interface HashtagValidation {
  hashtag: string;
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  platform: 'instagram' | 'facebook' | 'tiktok';
}

export function validateHashtags(
  hashtags: string[],
  platform: string
): HashtagValidation[] {
  // Implement validation logic
}
```

**Rules:**
- Instagram: 1-30 hashtags, max 30 chars each
- Facebook: Warn if >3
- TikTok: Suggest trending format
- Check shadowban list

### Phase 2: API Integration (3-4 giờ)
**File:** `src/lib/services/hashtag-analytics.ts`

**Option A: RapidAPI (Recommended)**
```typescript
export async function getHashtagStats(hashtag: string) {
  const response = await fetch(
    `https://hashtag-finder.p.rapidapi.com/hashtag/${hashtag}`,
    {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'hashtag-finder.p.rapidapi.com'
      }
    }
  );
  
  return {
    volume: number,        // Số posts
    difficulty: 'low' | 'medium' | 'high',
    related: string[],     // Hashtags liên quan
    trending: boolean      // Đang trending?
  };
}
```

**Option B: Instagram Graph API (If có Business Account)**
```typescript
// Search hashtag metrics
GET /{ig-hashtag-id}?fields=id,name,media_count
```

### Phase 3: Performance Tracking (1 ngày)
**Database Schema:**
```sql
CREATE TABLE hashtag_performance (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  hashtag TEXT NOT NULL,
  platform TEXT NOT NULL,
  post_id UUID,
  
  -- Metrics
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  -- Calculated
  engagement_rate DECIMAL(5,2),
  ctr DECIMAL(5,2),
  
  -- Meta
  used_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMP,
  avg_performance DECIMAL(5,2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hashtag_perf ON hashtag_performance(user_id, hashtag, platform);
```

**Features:**
- Track mỗi lần dùng hashtag
- Aggregate performance metrics
- Smart recommendations dựa trên data

---

## 🎯 UI/UX Improvements

### Current Flow:
```
User clicks "AI tạo hashtag" → AI generates → Display list → Done
```

### Improved Flow:
```
User clicks "AI tạo hashtag" 
  ↓
AI generates raw list
  ↓
Validation layer (format, platform rules)
  ↓
Analytics layer (volume, competition) ← External API
  ↓
Display with intelligence:
  
┌─────────────────────────────────────────────┐
│ 🏷️ Smart Hashtags (10)                     │
├─────────────────────────────────────────────┤
│ ✅ #salevietnam                             │
│    📊 10K posts • 🎯 Low competition       │
│                                             │
│ ⚠️ #sale                                    │
│    📊 50M posts • 🔥 Very high competition │
│    💡 Suggest: #salesaigon (better reach)  │
│                                             │
│ ❌ #follow4follow (Shadowban risk)          │
│    ⚠️ Có thể bị Instagram ẩn                │
└─────────────────────────────────────────────┘
```

### Component Structure:
```tsx
<HashtagInput>
  <AIGenerateButton />
  
  <HashtagList>
    {hashtags.map(tag => (
      <HashtagItem
        tag={tag}
        validation={validation}      // ✅ ⚠️ ❌
        analytics={analytics}         // Volume, competition
        performance={performance}     // Historical data
      />
    ))}
  </HashtagList>
  
  <HashtagSuggestions />  // Better alternatives
</HashtagInput>
```

---

## 💰 Cost Analysis

### Option 1: Basic Validation (FREE)
- No external API
- Rule-based validation
- Good enough for most users

### Option 2: RapidAPI Free Tier (FREE)
- 100 requests/day
- Enough for ~10 posts/day
- Volume + difficulty data

### Option 3: RapidAPI Pro ($9/month)
- 10,000 requests/month
- Real-time trending data
- Related hashtags suggestions

### Option 4: Custom Performance Tracking (FREE)
- Self-hosted database
- Learn from your own data
- No API costs

**Recommendation:** Start with Option 1 + 2 (Free tier)

---

## 📝 Implementation Priority

### High Priority (Do ngay)
1. ✅ **Platform-specific warnings**
   - Facebook: "⚠️ Hashtags ít hiệu quả trên Facebook, nên dùng 1-3 hashtags branded"
   - Zalo: "ℹ️ Zalo không hỗ trợ hashtag discovery"

2. ✅ **Banned hashtags check**
   - List 500+ shadowban hashtags
   - Warning user trước khi post

### Medium Priority (Tuần sau)
3. ✅ **RapidAPI integration**
   - Volume check
   - Competition score
   - Related hashtags

### Low Priority (Khi có budget)
4. ✅ **Performance tracking**
   - Database schema
   - Analytics dashboard
   - ML recommendations

---

## 🔍 Testing & Validation

### Test Cases:
```javascript
// Test 1: Instagram - Good hashtags
Input: ["#salevietnam", "#dealhanoi", "#flashsale"]
Expected: ✅ All valid, low-medium competition

// Test 2: Instagram - Spam hashtags
Input: ["#follow4follow", "#like4like", "#f4f"]
Expected: ❌ Shadowban warning

// Test 3: Facebook - Too many hashtags
Input: ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
Expected: ⚠️ "Facebook recommends 1-3 hashtags max"

// Test 4: Zalo - Hashtag không hỗ trợ
Input: ["#sale", "#deal"]
Expected: ℹ️ "Zalo không sử dụng hashtag discovery"
```

---

## 📚 Resources

### Shadowban Hashtags Lists:
- https://github.com/hashtags/instagram-shadowban-list
- 500+ banned hashtags updated monthly

### Hashtag Research Tools:
- **Display Purposes:** https://displaypurposes.com
- **All Hashtag:** https://all-hashtag.com
- **RiteTag:** https://ritetag.com

### Instagram Best Practices:
- Use 9-15 hashtags (optimal range)
- Mix popular + niche (70% niche, 30% popular)
- Location-based hashtags work well
- Branded hashtags for campaigns

---

## ✅ Next Steps

**Bạn muốn tôi implement level nào?**

1. **Level 1 (1-2 giờ):** Basic validation + platform warnings
2. **Level 2 (3-4 giờ):** RapidAPI integration + analytics
3. **Level 3 (1 ngày):** Full performance tracking system

**Recommendation:** Bắt đầu với Level 1 để user có feedback ngay lập tức, sau đó nâng cấp lên Level 2 khi cần data thực tế.

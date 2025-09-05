# AI Integration với Gemini 1.5 Flash-8B

## Tổng quan
EnhancedComposeModal đã được tích hợp với Google Gemini 1.5 Flash-8B AI model để cung cấp các tính năng thông minh:

- **Auto Caption**: Tạo caption tự động theo platform
- **Auto Hashtags**: Gợi ý hashtags trending và phù hợp  
- **Auto Script**: Tạo script video với timeline beats
- **Smart Scheduling**: Gợi ý thời gian đăng tối ưu

## Cấu hình API Key

### 1. Đăng ký Google AI Studio
1. Truy cập: https://ai.google.dev/
2. Đăng nhập bằng tài khoản Google
3. Tạo API key mới
4. Copy API key

### 2. Cấu hình Environment Variables
```bash
# Thêm vào file .env.local
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Chi phí sử dụng (Gemini 1.5 Flash-8B)
- **Input**: $0.0375 per 1M tokens (~750,000 từ)
- **Output**: $0.15 per 1M tokens (~750,000 từ)
- **Context**: 1M tokens context window
- **Tốc độ**: Tối ưu cho real-time applications

## API Endpoints đã tạo

### 1. `/api/ai/caption` - Tạo Caption
```typescript
POST /api/ai/caption
{
  "platform": "instagram" | "facebook" | "tiktok" | "zalo",
  "title": "Tên sản phẩm/nội dung",
  "content": "Mô tả chi tiết (optional)",
  "tone": "exciting" | "professional" | "casual" | "promotional",
  "targetAudience": "Đối tượng khách hàng",
  "productType": "Loại sản phẩm"
}
```

### 2. `/api/ai/hashtags` - Tạo Hashtags
```typescript
POST /api/ai/hashtags
{
  "platform": "instagram" | "facebook" | "tiktok" | "zalo",
  "title": "Tên sản phẩm",
  "content": "Nội dung bài đăng",
  "count": 10, // Số lượng hashtags (1-30)
  "productType": "Loại sản phẩm",
  "targetAudience": "Đối tượng"
}
```

### 3. `/api/ai/script` - Tạo Video Script
```typescript
POST /api/ai/script
{
  "platform": "tiktok" | "youtube" | "instagram",
  "duration": 30, // Thời lượng video (5-300 giây)
  "title": "Tiêu đề video",
  "content": "Nội dung chính",
  "style": "promotional" | "educational" | "entertainment" | "storytelling"
}
```

### 4. `/api/ai/optimal-times` - Gợi ý thời gian
```typescript
POST /api/ai/optimal-times
{
  "platforms": ["instagram", "facebook"], // Danh sách platforms
  "contentType": "promotional" | "educational" | "entertainment" | "news",
  "targetAudience": "teens" | "adults" | "professionals" | "general",
  "timezone": "Asia/Ho_Chi_Minh"
}
```

## Tích hợp trong UI

### Auto Caption Button
- **Vị trí**: Tab Social Media
- **Chức năng**: Tạo caption phù hợp với platform được chọn
- **Loading State**: Hiển thị spinner khi đang xử lý
- **Error Handling**: Hiển thị lỗi trong validation panel

### Auto Hashtags Button  
- **Vị trí**: Phần Hashtags trong Social tab
- **Chức năng**: Tạo 8 hashtags trending và phù hợp
- **Platform Aware**: Hashtags khác nhau cho từng platform

### Auto Script Button
- **Vị trí**: Tab Video Content
- **Chức năng**: Tạo script video với timeline beats
- **Output**: Hook + Beats timeline + CTA

### Smart Time Suggestion
- **Vị trí**: Scheduling section
- **Chức năng**: Gợi ý thời gian dựa trên platform và audience
- **Logic**: Phân tích từ AI thay vì hardcode

## Error Handling

### Common Errors
1. **API Key không hợp lệ**
   ```
   Error: "Gemini API key not configured"
   ```

2. **Rate Limiting**
   ```
   Error: "Too many requests. Please try again later."
   ```

3. **Network Issues**
   ```
   Error: "Không thể kết nối AI service"
   ```

### User Experience
- Loading states với spinner
- Error messages trong validation panel
- Fallback về template content nếu AI fail
- Retry mechanism cho network errors

## Performance & Optimization

### Token Usage Optimization
- **Prompt Engineering**: Tối ưu prompts để giảm token usage
- **Response Caching**: Cache kết quả để tránh duplicate calls
- **Batch Processing**: Gom nhiều requests khi có thể

### Cost Management
- **Usage Tracking**: Log API calls để monitor chi phí
- **Rate Limiting**: Giới hạn số calls per user per day
- **Fallback Templates**: Sử dụng templates khi vượt quota

## Monitoring & Analytics

### Metrics cần theo dõi
- API call frequency
- Token usage per month
- Success/error rates
- User satisfaction với AI content

### Dashboard suggestions
- Cost tracking per month
- Popular AI features
- Error rate monitoring
- Performance metrics

## Roadmap

### Phase 1 (Current)
- ✅ Basic AI integration
- ✅ Caption generation
- ✅ Hashtags generation
- ✅ Video script generation
- ✅ Optimal time suggestions

### Phase 2 (Next)
- [ ] Content analysis & improvements
- [ ] A/B testing for AI vs manual content
- [ ] Advanced prompt customization
- [ ] Multi-language support

### Phase 3 (Future)
- [ ] Custom model fine-tuning
- [ ] Image analysis integration
- [ ] Trending topics integration
- [ ] Performance prediction

## Development Notes

### Testing
```bash
# Test API endpoints
npm run test:api

# Test AI functions locally
npm run dev
# Navigate to /app and test each AI button
```

### Debugging
1. Check browser console for errors
2. Verify GEMINI_API_KEY in environment
3. Test API endpoints directly
4. Check rate limits and quotas

### Deployment
- Ensure GEMINI_API_KEY is set in production environment
- Monitor API usage and costs
- Set up alerting for errors and high usage

# AutoPost VN - Kế Hoạch Phát Triển Dự Án

## 🎯 Tổng Quan Dự Án

**AutoPost VN** là công cụ PWA "all-in-one" cho thị trường Việt Nam giúp chủ shop/SMB lên lịch & đăng chéo lên Facebook Page, Instagram Business, Zalo OA với tính năng gợi ý "giờ vàng", hàng đợi, nhật ký và phân tích cơ bản.

### Điểm Mạnh Cốt Lõi
- ✅ Tập trung trải nghiệm tiếng Việt
- ✅ Hỗ trợ nền tảng bản địa (Zalo OA)  
- ✅ Giao diện cực đơn giản cho người không rành kỹ thuật
- ✅ Hoạt động trên cả điện thoại và máy tính (PWA)
- ✅ Offline-first với đồng bộ khi online

---

## 📊 Trạng Thái Hiện Tại (MVP)

### ✅ Đã Hoàn Thành
- **Kiến trúc cơ bản**: Next.js 14 + Tailwind + Supabase
- **Database schema**: Đầy đủ tables (workspaces, social_accounts, channels, posts, scheduled_jobs, publish_results)
- **PWA setup**: manifest.webmanifest + service worker cơ bản
- **API cơ bản**: `/api/posts`, `/api/schedule`, `/api/cron/scheduler`
- **Scheduler engine**: Logic lấy và xử lý jobs định kỳ
- **Provider stubs**: Facebook, Instagram, Zalo (mock implementations)
- **Security**: RLS policies trên Supabase
- **Scripts**: seed data, local cron testing

### ⚠️ Cần Cải Thiện
- **UI/UX**: Chỉ có placeholder, chưa có giao diện thực tế
- **Authentication**: Chưa có đăng nhập/đăng ký
- **OAuth Integration**: Chưa kết nối thật với FB/IG/Zalo
- **Media handling**: Chưa upload/quản lý hình ảnh
- **Error handling**: Còn cơ bản
- **Responsive design**: Chưa tối ưu mobile

---

## 🚀 Roadmap Phát Triển

### Phase 1: Foundation & Core UX (Tuần 1-3)

#### 1.1 Authentication & Workspace Management
- [ ] Thiết lập Supabase Auth (email/password, Google)
- [ ] Trang đăng nhập/đăng ký với UX Việt Nam
- [ ] Workspace selector/creator
- [ ] User profile management
- [ ] RLS policies theo user_id thực tế

#### 1.2 Core UI/UX Design
- [ ] Design system cho thị trường VN (màu sắc, typography)
- [ ] Layout chính với sidebar navigation
- [ ] Responsive design mobile-first
- [ ] Loading states và error boundaries
- [ ] Toast notifications tiếng Việt

#### 1.3 Composer Interface (Soạn Bài)
- [ ] Rich text editor cho caption
- [ ] Media upload (images) với preview
- [ ] Channel selector với UI đẹp
- [ ] Date/time picker với timezone VN
- [ ] "Giờ vàng" suggestions (hardcoded list)
- [ ] Draft saving (localStorage + server)

### Phase 2: Social Platform Integration (Tuần 3-5)

#### 2.1 Facebook Integration
- [ ] Facebook App setup (Graph API)
- [ ] OAuth flow cho Pages
- [ ] Token management & refresh
- [ ] Page posting với text + images
- [ ] Error handling cho rate limits

#### 2.2 Instagram Business Integration  
- [ ] Instagram Basic Display + Graph API
- [ ] Business account connection
- [ ] Media upload flow
- [ ] Caption với hashtags support

#### 2.3 Zalo OA Integration
- [ ] Zalo OA API setup
- [ ] OAuth flow cho Official Account
- [ ] Message template support
- [ ] Rich media messaging

#### 2.4 Enhanced Scheduler
- [ ] Real provider implementations
- [ ] Retry logic với exponential backoff
- [ ] Token refresh trước khi post
- [ ] Multi-account support per platform

### Phase 3: Queue & Analytics (Tuần 5-7)

#### 3.1 Hàng Đợi (Queue Management)
- [ ] Danh sách bài scheduled với filters
- [ ] Status tracking realtime
- [ ] Bulk operations (cancel, reschedule)
- [ ] Preview trước khi đăng
- [ ] Edit scheduled posts

#### 3.2 Nhật Ký (Activity Log)
- [ ] Timeline view của tất cả activities
- [ ] Success/failure indicators
- [ ] Error details với actions suggest
- [ ] Search & filter logs
- [ ] Export logs (CSV)

#### 3.3 Lịch Tuần (Weekly Calendar)
- [ ] Calendar view với post cards
- [ ] Drag & drop reschedule
- [ ] Color coding theo platforms
- [ ] Quick actions từ calendar
- [ ] Weekly/monthly view switch

#### 3.4 Phân Tích Cơ Bản (Basic Analytics)
- [ ] Dashboard overview
- [ ] Posts count by platform/day
- [ ] Success rate metrics
- [ ] Peak hours analysis
- [ ] Simple charts (Chart.js)

### Phase 4: Advanced Features (Tuần 7-10)

#### 4.1 Smart Scheduling
- [ ] AI-powered optimal time suggestions
- [ ] Audience timezone consideration
- [ ] Performance-based recommendations
- [ ] Batch scheduling tools

#### 4.2 Content Enhancement
- [ ] Hashtag suggestions
- [ ] Caption templates library
- [ ] AI caption generation (OpenAI/local)
- [ ] Media optimization
- [ ] Bulk upload tools

#### 4.3 Team Features
- [ ] Multi-user workspace
- [ ] Role-based permissions
- [ ] Approval workflow
- [ ] Comment/collaboration tools

#### 4.4 Enterprise Features
- [ ] White-label options
- [ ] API webhooks
- [ ] Advanced analytics
- [ ] Custom integrations

### Phase 5: Monetization & Scale (Tuần 10-12)

#### 5.1 Subscription System
- [ ] Stripe + VN payment gateways (MoMo, ZaloPay, VNPay)
- [ ] Plan management (Free, Pro, Team)
- [ ] Usage tracking & limits
- [ ] Billing dashboard

#### 5.2 Performance & Scale
- [ ] Database optimization
- [ ] CDN setup cho media files
- [ ] Caching strategies
- [ ] Background job queues (Bull/Agenda)
- [ ] Monitoring & alerting

#### 5.3 Marketing & Growth
- [ ] Landing page optimized
- [ ] SEO cho thị trường VN
- [ ] Social proof & testimonials
- [ ] Referral program
- [ ] Content marketing strategy

---

## 💰 Mô Hình Kinh Doanh

### Freemium Tier (Miễn Phí)
- ✅ 1 workspace
- ✅ Tối đa 2 kênh social
- ✅ 30 bài/tháng
- ✅ Lịch 7 ngày
- ✅ Phân tích cơ bản
- ✅ Hỗ trợ community

### Pro Tier (299k/tháng)
- ✅ 5-10 kênh social  
- ✅ Unlimited posts
- ✅ Phân tích nâng cao
- ✅ AI caption suggestions
- ✅ Ưu tiên hàng đợi
- ✅ Lịch nhiều tuần
- ✅ Export data

### Team Tier (799k/tháng)
- ✅ Nhiều thành viên/roles
- ✅ Lịch chung team
- ✅ Approval workflow  
- ✅ Báo cáo CSV/Sheets
- ✅ Webhook/API events
- ✅ Priority support
- ✅ White-label options

### Add-ons
- 🔥 AI Credits (99k/tháng): Caption + image generation
- 📈 Extra Channels (49k/channel/tháng)  
- 📚 Template Library (149k one-time)
- 💾 Storage Boost (29k/GB/tháng)

---

## 🛠 Tech Stack & Tools

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Headless UI
- **State**: Zustand hoặc Jotai
- **Forms**: React Hook Form + Zod
- **Charts**: Chart.js hoặc Recharts
- **PWA**: Workbox

### Backend  
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **File Storage**: Supabase Storage
- **Cron**: Vercel Cron hoặc Cloudflare Workers

### External APIs
- **Facebook**: Graph API v18+
- **Instagram**: Instagram Basic Display + Graph API
- **Zalo**: Zalo OA API
- **Payment**: Stripe + VN gateways
- **AI**: OpenAI GPT-4 hoặc local models

### DevOps
- **Hosting**: Vercel hoặc Cloudflare Pages
- **Database**: Supabase Cloud
- **Monitoring**: Sentry + Vercel Analytics
- **CI/CD**: GitHub Actions

---

## 📱 UI/UX Priorities

### Design Principles
1. **Mobile-First**: 70% traffic từ mobile tại VN
2. **Simplicity**: Người dùng không tech-savvy
3. **Vietnamese-Centric**: Ngôn ngữ, văn hóa, thói quen
4. **Fast Loading**: Mạng chậm/không ổn định
5. **Offline Capable**: PWA với sync khi online

### Key Screens Priority
1. **Login/Onboarding** (Phase 1)
2. **Composer** (Phase 1) 
3. **Queue Management** (Phase 3)
4. **Calendar View** (Phase 3)
5. **Analytics Dashboard** (Phase 3)
6. **Settings** (Phase 2)

### Mobile Experience
- Thumb-friendly navigation
- Swipe gestures
- Fast image uploads
- Offline drafts
- Push notifications

---

## 🔄 Development Workflow

### Branch Strategy
```
main (production)
├── develop (staging)
├── feature/auth-system
├── feature/facebook-integration
└── feature/composer-ui
```

### Release Cycle
- **Weekly releases** during active development
- **Feature flags** cho testing
- **A/B testing** cho UX decisions
- **Gradual rollouts** cho major features

### Quality Assurance
- TypeScript strict mode
- ESLint + Prettier
- Unit tests (Jest + Testing Library)
- E2E tests (Playwright)
- Manual testing on real devices

---

## 📈 Success Metrics

### Technical KPIs
- **Performance**: < 2s load time, 90+ Lighthouse score
- **Reliability**: 99.9% uptime, < 1% failed posts
- **Scale**: Handle 10k+ scheduled posts/day

### Business KPIs
- **User Growth**: 1000 MAU trong 6 tháng đầu
- **Conversion**: 5% free → paid conversion
- **Retention**: 60% monthly retention
- **Revenue**: $10k MRR sau 12 tháng

### User Experience KPIs
- **Time to First Post**: < 5 phút từ signup
- **Daily Active Users**: 30% của total users
- **Support Tickets**: < 2% users/month
- **NPS Score**: > 50

---

## 🚧 Risks & Mitigation

### Technical Risks
- **API Rate Limits**: Implement smart queuing, multiple apps
- **Token Expiry**: Proactive refresh, user notifications  
- **Platform Changes**: Monitor APIs, quick adaptation
- **Scale Issues**: Database optimization, caching layers

### Business Risks
- **Competition**: Focus on VN market, local advantages
- **Platform Policies**: Diversify platforms, comply strictly
- **Payment Issues**: Multiple gateways, clear terms
- **User Education**: Comprehensive docs, video tutorials

### Market Risks
- **Economic Downturn**: Freemium model, affordable pricing
- **Regulation Changes**: Legal compliance, data protection
- **Technology Shifts**: Adaptable architecture, modern stack

---

## 🎯 Next Immediate Actions

### Week 1 Priorities
1. **Setup Authentication** - Supabase Auth integration
2. **Design System** - Colors, fonts, components
3. **Composer MVP** - Basic UI cho tạo posts
4. **Mobile Layout** - Responsive navigation

### Quick Wins
- Update placeholder UI với branding thực tế
- Add Vietnamese translations
- Improve error messages
- Setup basic monitoring
- Create development environment docs

---

*Kế hoạch này sẽ được cập nhật hàng tuần dựa trên tiến độ thực tế và phản hồi từ users/stakeholders.*

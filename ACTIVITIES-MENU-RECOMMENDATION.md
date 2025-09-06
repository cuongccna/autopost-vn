// Recommended implementation for Activities menu

// 1. Add to main navigation
const navigationItems = [
  { name: 'Lịch & Lên lịch', href: '/app', icon: '📅' },
  { name: 'Hàng đợi & Nhật ký', href: '/app/queue', icon: '📋' },
  { name: 'Phân tích', href: '/app/analytics', icon: '📊' },
  { name: 'Hoạt động', href: '/app/activities', icon: '🔍' }, // NEW
  { name: 'Tài khoản', href: '/app/accounts', icon: '👤' },
  { name: 'Cài đặt', href: '/app/settings', icon: '⚙️' },
];

// 2. Mini widget in dashboard sidebar
export function RecentActivitiesWidget() {
  const { logs } = useActivityLogs({ limit: 5 });
  
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Hoạt động gần đây</h3>
        <Link 
          href="/app/activities"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Xem tất cả →
        </Link>
      </div>
      
      <div className="space-y-2">
        {logs.slice(0, 3).map((log) => (
          <div key={log.id} className="flex items-center gap-2 text-sm">
            <StatusIcon status={log.status} />
            <span className="text-gray-600 truncate flex-1">
              {log.description}
            </span>
            <span className="text-xs text-gray-400">
              {formatRelativeTime(log.created_at)}
            </span>
          </div>
        ))}
        
        {logs.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">
            Chưa có hoạt động nào
          </p>
        )}
      </div>
    </div>
  );
}

// 3. Full activities page
export default function ActivitiesPage() {
  const [view, setView] = useState<'recent' | 'all' | 'errors'>('recent');
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Hoạt động" 
        description="Theo dõi tất cả hoạt động trong tài khoản của bạn"
      />
      
      {/* Quick Stats */}
      <ActivityStatsCards />
      
      {/* Filter Tabs */}
      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="recent">Gần đây</TabsTrigger>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="errors">
            Lỗi {errorCount > 0 && <Badge>{errorCount}</Badge>}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent">
          <ActivityLogsView filters={{ limit: 50 }} />
        </TabsContent>
        
        <TabsContent value="all">
          <ActivityLogsView showFilters={true} />
        </TabsContent>
        
        <TabsContent value="errors">
          <ActivityLogsView filters={{ status: 'failed' }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 4. Integration points
// - Add notification badge for recent errors
// - Link from error states to activities page
// - Quick actions from activity items
// - Export functionality for compliance

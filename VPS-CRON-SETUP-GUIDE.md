# VPS Cron Job Setup Guide - AutoPost VN

## 📋 Tổng quan

Hướng dẫn này giúp bạn setup scheduler tự động chạy trên VPS Linux để post bài theo lịch.

## 🎯 Yêu cầu
- VPS chạy Linux (Ubuntu 20.04+ hoặc CentOS 7+)
- Node.js 18+ đã cài đặt
- PostgreSQL đang chạy  
- App đã deploy và chạy (Next.js production hoặc PM2)
- Domain đã trỏ về VPS (hoặc dùng localhost)

---

## ✅ Option 1: Systemd Timer (Khuyên dùng cho production)

Systemd timer là native Linux scheduler, reliable và dễ quản lý.

### Bước 1: Tạo script wrapper

```bash
sudo nano /opt/autopost-vn/scheduler.sh
```

```bash
#!/bin/bash
# AutoPost VN Scheduler Runner

# Config
APP_URL="http://localhost:3000"
LOG_DIR="/var/log/autopost-vn"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="$LOG_DIR/scheduler-$TIMESTAMP.log"

# Create log directory
mkdir -p $LOG_DIR

# Run scheduler via API
echo "[$TIMESTAMP] Starting scheduler..." >> $LOG_FILE
curl -X GET "$APP_URL/api/cron/scheduler?limit=20" \
  -H "Content-Type: application/json" \
  >> $LOG_FILE 2>&1

# Cleanup old logs (keep last 7 days)
find $LOG_DIR -name "scheduler-*.log" -mtime +7 -delete

echo "[$TIMESTAMP] Scheduler completed" >> $LOG_FILE
```

```bash
chmod +x /opt/autopost-vn/scheduler.sh
```

### Bước 2: Tạo systemd service

```bash
sudo nano /etc/systemd/system/autopost-scheduler.service
```

```ini
[Unit]
Description=AutoPost VN Scheduler
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/autopost-vn/scheduler.sh
User=www-data
StandardOutput=journal
StandardError=journal
```

### Bước 3: Tạo systemd timer

```bash
sudo nano /etc/systemd/system/autopost-scheduler.timer
```

```ini
[Unit]
Description=AutoPost VN Scheduler Timer
Requires=autopost-scheduler.service

[Timer]
# Chạy mỗi 5 phút
OnBootSec=2min
OnUnitActiveSec=5min
AccuracySec=1s

[Install]
WantedBy=timers.target
```

### Bước 4: Enable và start timer

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable timer (tự động start khi boot)
sudo systemctl enable autopost-scheduler.timer

# Start timer ngay
sudo systemctl start autopost-scheduler.timer

# Check status
sudo systemctl status autopost-scheduler.timer
sudo systemctl list-timers --all | grep autopost
```

### Bước 5: Monitor logs

```bash
# Xem logs realtime
sudo journalctl -u autopost-scheduler.service -f

# Xem logs của lần chạy gần nhất
sudo journalctl -u autopost-scheduler.service -n 50

# Xem scheduler output logs
tail -f /var/log/autopost-vn/scheduler-*.log
```

---

## ✅ Option 2: Traditional Cron Job (Đơn giản, dễ setup)

### Bước 1: Tạo cron script

Sử dụng script `/opt/autopost-vn/scheduler.sh` từ Option 1

### Bước 2: Add vào crontab

```bash
crontab -e
```

Thêm dòng này (chạy mỗi 5 phút):

```cron
*/5 * * * * /opt/autopost-vn/scheduler.sh >> /var/log/autopost-vn/cron.log 2>&1
```

Hoặc cron expressions khác:

```cron
# Mỗi phút
* * * * * /opt/autopost-vn/scheduler.sh

# Mỗi 3 phút
*/3 * * * * /opt/autopost-vn/scheduler.sh

# Mỗi 10 phút
*/10 * * * * /opt/autopost-vn/scheduler.sh

# Mỗi giờ lúc phút thứ 0
0 * * * * /opt/autopost-vn/scheduler.sh

# Mỗi ngày lúc 8:00 AM
0 8 * * * /opt/autopost-vn/scheduler.sh
```

### Bước 3: Verify cron đang chạy

```bash
# List cronjobs
crontab -l

# Check syslog
sudo grep CRON /var/log/syslog | tail -20

# Check scheduler logs
tail -f /var/log/autopost-vn/cron.log
```

---

## ✅ Option 3: PM2 Cron (Nếu dùng PM2)

Nếu app chạy với PM2, có thể dùng PM2 cron feature.

### Bước 1: Tạo standalone scheduler script

```bash
nano /opt/autopost-vn/scripts/pm2-scheduler.js
```

```javascript
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/cron/scheduler?limit=20',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`[${new Date().toISOString()}] Scheduler result:`, data);
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error(`[${new Date().toISOString()}] Error:`, error);
  process.exit(1);
});

req.end();
```

### Bước 2: Add vào PM2 ecosystem

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'autopost-vn-web',
      script: 'npm',
      args: 'start',
      cwd: '/opt/autopost-vn',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'autopost-scheduler',
      script: '/opt/autopost-vn/scripts/pm2-scheduler.js',
      cron_restart: '*/5 * * * *',  // Mỗi 5 phút
      autorestart: false,
      watch: false
    }
  ]
};
```

### Bước 3: Start với PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 📊 Monitoring & Troubleshooting

### 1. Check scheduler đã chạy chưa

```bash
# Check database
psql -U autopost_admin -d autopost_vn -c "
SELECT 
  ps.id, 
  ps.scheduled_at, 
  ps.status, 
  ps.published_at,
  p.title
FROM autopostvn_post_schedules ps
JOIN autopostvn_posts p ON p.id = ps.post_id
WHERE ps.scheduled_at > NOW() - INTERVAL '1 hour'
ORDER BY ps.scheduled_at DESC
LIMIT 10;
"
```

### 2. Check activity logs

```bash
psql -U autopost_admin -d autopost_vn -c "
SELECT 
  action_type,
  action_category,
  created_at,
  metadata->>'message' as message
FROM autopostvn_system_activity_logs
WHERE action_category = 'post_publish'
ORDER BY created_at DESC
LIMIT 10;
"
```

### 3. Common issues

**Scheduler không chạy:**
- Check timer/cron status: `systemctl status autopost-scheduler.timer`
- Check logs: `journalctl -u autopost-scheduler.service`
- Verify script có execute permission: `ls -la /opt/autopost-vn/scheduler.sh`

**Scheduler chạy nhưng không post:**
- Check app đang chạy: `curl http://localhost:3000/health`
- Check Facebook tokens chưa expire
- Check database connection
- Check logs: `tail -f /var/log/autopost-vn/scheduler-*.log`

**Posts bị delay:**
- Giảm cron interval (từ 5 phút xuống 3 phút hoặc 1 phút)
- Tăng limit parameter trong scheduler.sh: `?limit=50`
- Check database performance

---

## 🔒 Security Best Practices

### 1. Restrict API access (Recommended)

Thêm API key authentication cho cron endpoint:

```typescript
// src/app/api/cron/scheduler/route.ts
export async function GET(request: Request) {
  const apiKey = request.headers.get('X-API-Key');
  const validKey = process.env.CRON_API_KEY;
  
  if (!validKey || apiKey !== validKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... rest of code
}
```

Update script:

```bash
curl -X GET "$APP_URL/api/cron/scheduler?limit=20" \
  -H "X-API-Key: $CRON_API_KEY" \
  >> $LOG_FILE 2>&1
```

### 2. Rate limiting

Implement rate limiting để tránh abuse:

```typescript
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  const rateLimitResult = await rateLimit('cron-scheduler', 12); // 12 requests/hour
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  // ... rest
}
```

### 3. IP whitelist

Chỉ cho phép localhost hoặc IP của cron server:

```typescript
export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'localhost';
  const allowedIPs = ['127.0.0.1', 'localhost', process.env.CRON_SERVER_IP];
  
  if (!allowedIPs.includes(ip)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // ... rest
}
```

---

## 📈 Performance Tuning

### Adjust scheduler frequency based on load:

| Users | Recommended Interval | Limit per run |
|-------|---------------------|---------------|
| < 50  | 5 minutes           | 10            |
| 50-200| 3 minutes           | 20            |
| 200-500| 2 minutes          | 50            |
| 500+  | 1 minute            | 100           |

### Database indexing

```sql
-- Improve scheduler query performance
CREATE INDEX IF NOT EXISTS idx_schedules_pending 
ON autopostvn_post_schedules(scheduled_at, status) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_schedules_post_id 
ON autopostvn_post_schedules(post_id);
```

---

## ✅ Verification Checklist

- [ ] Script có execute permission
- [ ] Cron/Timer đã enabled và running
- [ ] Logs directory tồn tại và có write permission
- [ ] App API endpoint responding (test với curl)
- [ ] Database connection working
- [ ] Test manual run: `/opt/autopost-vn/scheduler.sh`
- [ ] Check logs sau 5 phút đầu
- [ ] Verify 1 post được auto-published thành công

---

## 📞 Need Help?

Check logs first:
```bash
# Systemd
sudo journalctl -u autopost-scheduler.service -f

# Cron
tail -f /var/log/autopost-vn/cron.log

# PM2
pm2 logs autopost-scheduler
```

Common commands:
```bash
# Restart timer
sudo systemctl restart autopost-scheduler.timer

# Force run now
sudo systemctl start autopost-scheduler.service

# Disable timer temporarily
sudo systemctl stop autopost-scheduler.timer
```

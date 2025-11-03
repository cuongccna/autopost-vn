# 🔄 Migration to Optimized Scheduler - Checklist

## Pre-Migration Checklist

### 1. Backup & Safety
- [ ] Backup database
- [ ] Document current scheduler configuration
- [ ] Record current performance metrics (baseline)
- [ ] Set up rollback plan

### 2. Environment Setup
- [ ] Copy `.env.example` to `.env.local`
- [ ] Configure environment variables:
  ```bash
  SCHEDULER_CONCURRENCY=5
  SCHEDULER_BATCH_SIZE=20
  SCHEDULER_CACHE_TTL=300
  DATABASE_MAX_CONNECTIONS=20
  ENABLE_PERFORMANCE_MONITORING=true
  ```
- [ ] Review and adjust for your infrastructure

### 3. Code Verification
- [ ] Verify all new files exist:
  - [ ] `src/lib/scheduler-optimized.ts`
  - [ ] `src/lib/services/cache.service.ts`
  - [ ] `src/lib/services/performance-monitor.service.ts`
  - [ ] `src/lib/social-publishers-optimized.ts`
  - [ ] `src/app/api/cron/scheduler-optimized/route.ts`
  - [ ] `src/app/api/performance/route.ts`
- [ ] Run TypeScript compilation: `npm run build`
- [ ] Fix any compilation errors

## Testing Phase

### 1. Local Testing
- [ ] Start dev server: `npm run dev`
- [ ] Test optimized scheduler with small batch:
  ```bash
  curl -X POST http://localhost:3000/api/cron/scheduler-optimized \
    -H "Content-Type: application/json" \
    -d '{"limit": 5, "concurrency": 2}'
  ```
- [ ] Verify success response
- [ ] Check logs for errors

### 2. Performance Verification
- [ ] Check performance metrics:
  ```bash
  curl http://localhost:3000/api/performance?type=summary
  ```
- [ ] Verify cache is working (cache hit rate > 0%)
- [ ] Check processing time is improved
- [ ] Monitor database connection count

### 3. Functionality Testing
- [ ] Create test posts
- [ ] Schedule test posts
- [ ] Run scheduler
- [ ] Verify posts published successfully
- [ ] Check activity logs
- [ ] Verify error handling works

## Staging Deployment

### 1. Deploy to Staging
- [ ] Deploy code to staging environment
- [ ] Set staging environment variables
- [ ] Verify build successful
- [ ] Run health checks

### 2. Staging Tests
- [ ] Test with production-like data volume
- [ ] Monitor for 24 hours
- [ ] Check error rates
- [ ] Verify performance improvements
- [ ] Test edge cases:
  - [ ] Rate limit exceeded scenarios
  - [ ] Token expiry handling
  - [ ] Network failures
  - [ ] Invalid media URLs

### 3. Performance Comparison
- [ ] Compare old vs new scheduler:
  - [ ] Processing time
  - [ ] Database query count
  - [ ] Success rate
  - [ ] Error rate
  - [ ] Resource usage

## Production Migration

### Phase 1: Soft Launch (Days 1-3)

#### Day 1: Parallel Run
- [ ] Keep old scheduler running (primary)
- [ ] Run new scheduler manually every hour:
  ```bash
  curl -X POST https://your-domain.com/api/cron/scheduler-optimized \
    -d '{"limit": 10, "concurrency": 3}'
  ```
- [ ] Compare results with old scheduler
- [ ] Monitor for discrepancies
- [ ] Check error logs

#### Day 2: Increased Load
- [ ] Increase new scheduler limit to 20
- [ ] Run every 30 minutes
- [ ] Monitor performance metrics
- [ ] Verify cache effectiveness
- [ ] Check database load

#### Day 3: Equal Split
- [ ] Run both schedulers alternately
- [ ] Old: runs at :00, :30
- [ ] New: runs at :15, :45
- [ ] Compare performance side-by-side
- [ ] Verify no data inconsistencies

### Phase 2: Primary Transition (Days 4-5)

#### Day 4: New as Primary
- [ ] Update main cron job to new scheduler:
  ```bash
  */5 * * * * curl https://your-domain.com/api/cron/scheduler-optimized
  ```
- [ ] Keep old scheduler as backup (manual only)
- [ ] Monitor closely for issues
- [ ] Be ready to rollback if needed

#### Day 5: Monitoring & Tuning
- [ ] Review 24h performance data
- [ ] Tune concurrency if needed
- [ ] Adjust batch size based on load
- [ ] Optimize cache TTL
- [ ] Document any issues found

### Phase 3: Full Cutover (Day 6+)

#### Day 6: Remove Old Scheduler
- [ ] Verify new scheduler stable for 48+ hours
- [ ] Remove old scheduler cron job
- [ ] Keep old code for emergency rollback
- [ ] Update documentation

#### Day 7: Optimization
- [ ] Analyze performance metrics
- [ ] Fine-tune configuration
- [ ] Set up alerts for errors
- [ ] Document lessons learned

## Post-Migration

### 1. Monitoring Setup
- [ ] Set up performance monitoring dashboard
- [ ] Configure alerts:
  - [ ] Error rate > 5%
  - [ ] Processing time > 5 seconds
  - [ ] Database connections > 80% of max
  - [ ] Cache hit rate < 70%
- [ ] Schedule daily performance reviews

### 2. Documentation
- [ ] Update runbooks
- [ ] Document new cron schedule
- [ ] Update troubleshooting guides
- [ ] Share knowledge with team

### 3. Cleanup
- [ ] Archive old scheduler code (don't delete yet)
- [ ] Clean up old logs
- [ ] Remove temporary test data
- [ ] Update infrastructure diagrams

## Rollback Plan

### If Issues Occur

#### Immediate Rollback (< 5 minutes)
1. **Stop new scheduler:**
   ```bash
   # Disable cron job
   # Comment out in crontab
   ```

2. **Re-enable old scheduler:**
   ```bash
   # Update cron to use old endpoint
   */5 * * * * curl https://your-domain.com/api/cron/scheduler
   ```

3. **Verify old scheduler working**

#### Partial Rollback (5-30 minutes)
1. **Reduce new scheduler load:**
   - Decrease `SCHEDULER_CONCURRENCY` to 1
   - Decrease `SCHEDULER_BATCH_SIZE` to 5
   - Increase interval to every 10 minutes

2. **Run old scheduler for urgent jobs**

3. **Investigate and fix issues**

#### Full Rollback (> 30 minutes)
1. **Revert code deployment**
2. **Restore old environment variables**
3. **Clear all caches**
4. **Verify system stability**
5. **Post-mortem analysis**

## Success Criteria

### Must Have
- ✅ Processing time reduced by > 50%
- ✅ Error rate < 5%
- ✅ Success rate > 95%
- ✅ Cache hit rate > 70% after warmup
- ✅ No data loss or corruption
- ✅ All features working as before

### Nice to Have
- ✅ Processing time reduced by > 70%
- ✅ Database queries reduced by > 80%
- ✅ Cache hit rate > 85%
- ✅ Real-time monitoring in place
- ✅ Improved error messages
- ✅ Better retry logic

## Key Metrics to Track

### During Migration
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Processing Time | < 200ms/job | ___ | ⏳ |
| Error Rate | < 5% | ___ | ⏳ |
| Success Rate | > 95% | ___ | ⏳ |
| DB Queries | < 5/batch | ___ | ⏳ |
| Cache Hit Rate | > 70% | ___ | ⏳ |
| Response Time | < 5s | ___ | ⏳ |

### After Migration (7 days)
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Avg Processing Time | ___ | ___ | ___% |
| Total DB Queries | ___ | ___ | ___% |
| Throughput | ___ | ___ | ___x |
| Error Rate | ___ | ___ | ___% |
| Success Rate | ___ | ___ | ___% |

## Team Communication

### Stakeholder Updates

#### Day 1 (Start)
- [ ] Notify team of migration start
- [ ] Share monitoring dashboard access
- [ ] Provide emergency contact info

#### Day 3 (Mid-point)
- [ ] Share progress update
- [ ] Report any issues
- [ ] Adjust timeline if needed

#### Day 6 (Completion)
- [ ] Announce successful migration
- [ ] Share performance improvements
- [ ] Document lessons learned

#### Day 14 (Review)
- [ ] Present final results
- [ ] Share optimization recommendations
- [ ] Plan next improvements

## Emergency Contacts

- **On-call Engineer:** _______________
- **Database Admin:** _______________
- **DevOps Lead:** _______________
- **Product Owner:** _______________

## Notes & Observations

### Migration Issues
```
Date | Issue | Resolution | Impact
-----|-------|------------|-------
     |       |            |
```

### Performance Observations
```
Date | Metric | Value | Notes
-----|--------|-------|------
     |        |       |
```

### Optimization Opportunities
```
Area | Current | Target | Priority
-----|---------|--------|----------
     |         |        |
```

---

**Migration Start Date:** _______________
**Target Completion:** _______________
**Actual Completion:** _______________
**Status:** ⏳ Pending / 🔄 In Progress / ✅ Complete / ❌ Rolled Back

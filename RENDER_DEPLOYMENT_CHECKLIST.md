# AutoPost VN - Render Deployment Checklist

## 🚀 Pre-Deployment Checklist

### ✅ Repository Preparation
- [ ] `render.yaml` file exists in root directory
- [ ] `scripts/render-cron.js` script created and tested
- [ ] `npm run cron:render` script added to package.json
- [ ] Environment variables documented
- [ ] Code pushed to main branch

### ✅ Local Testing Completed
- [ ] `npm run cron:render` works locally
- [ ] Health check endpoint `/api/health` responds
- [ ] Scheduler endpoint `/api/cron/scheduler` functions
- [ ] Facebook OAuth integration working
- [ ] Database connections tested

## 🌐 Render Deployment Steps

### Step 1: Create Services
1. **Login to Render Dashboard**: https://dashboard.render.com
2. **Create Blueprint**:
   - Click "New" → "Blueprint"
   - Connect GitHub repository: `autopost-vn`
   - Select `render.yaml` file
   - Click "Apply"

### Step 2: Configure Environment Variables

#### For Web Service (autopost-vn-web):
```bash
NODE_ENV=production
DATABASE_URL=[Auto-filled from database]
NEXTAUTH_URL=https://autopost-vn-web.onrender.com
NEXTAUTH_SECRET=[Generate new secret]
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
ZALO_APP_ID=your-zalo-app-id
ZALO_APP_SECRET=your-zalo-app-secret
```

#### For Cron Job (autopost-vn-scheduler):
```bash
NODE_ENV=production
DATABASE_URL=[Auto-filled from database]
RENDER_INTERNAL_URL=[Auto-filled from web service]
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
ZALO_APP_ID=your-zalo-app-id
ZALO_APP_SECRET=your-zalo-app-secret
```

### Step 3: Verify Deployment

#### Web Service Check:
- [ ] Web service builds successfully
- [ ] Application starts without errors
- [ ] Health check URL works: `https://your-app.onrender.com/api/health`
- [ ] User can login and access dashboard

#### Database Check:
- [ ] Database connection successful
- [ ] Tables and schema migrated correctly
- [ ] Sample data can be inserted/retrieved

#### Cron Job Check:
- [ ] Cron job builds successfully
- [ ] First execution completes without errors
- [ ] Logs show expected output format
- [ ] Schedule triggers at correct intervals

## 📊 Production Monitoring

### Daily Checks:
- [ ] Cron job execution logs
- [ ] Facebook API rate limits status
- [ ] Database connection health
- [ ] Application error rates

### Weekly Checks:
- [ ] Posted content analytics
- [ ] User engagement metrics
- [ ] System performance metrics
- [ ] Cost optimization review

## 🔧 Troubleshooting Common Issues

### Issue: Cron job fails to connect to web service
**Solution**: Check `RENDER_INTERNAL_URL` environment variable

### Issue: Facebook API errors
**Solution**: Verify OAuth tokens haven't expired, refresh if needed

### Issue: Database connection timeouts
**Solution**: Check database plan limits, consider upgrading

### Issue: Cron job times out after 12 hours
**Solution**: Optimize scheduler code, reduce batch sizes

## 📈 Performance Optimization

### Cron Job Optimization:
- Use appropriate `limit` parameter for batch processing
- Monitor execution time and adjust schedule if needed
- Implement retry logic for failed posts
- Log performance metrics for analysis

### Database Optimization:
- Add indexes for frequently queried fields
- Monitor connection pool usage
- Regular cleanup of old logs/data
- Consider read replicas for heavy read operations

## 💰 Cost Management

### Expected Costs (Monthly):
- **Web Service (Starter)**: $7/month
- **Database (Starter)**: $7/month  
- **Cron Job (Starter)**: $1-5/month (based on execution time)
- **Total**: ~$15-20/month

### Cost Optimization Tips:
- Adjust cron frequency based on actual posting needs
- Use smaller instance types if CPU/memory usage is low
- Monitor usage metrics and scale accordingly
- Consider shared database for multiple environments

## 🎯 Success Criteria

### Deployment Successful When:
- [ ] Web application accessible at production URL
- [ ] Users can authenticate with Facebook OAuth
- [ ] Posts can be created and scheduled
- [ ] Cron job runs every 5 minutes without errors
- [ ] Posts automatically publish to Facebook
- [ ] Logs show successful post publications
- [ ] Application handles failures gracefully

### Ready for Users When:
- [ ] All features tested in production environment
- [ ] Error monitoring and alerting configured
- [ ] Backup and recovery procedures documented
- [ ] User documentation updated
- [ ] Support processes established

## 📞 Support & Maintenance

### Emergency Contacts:
- Render Support: https://render.com/docs
- Facebook Developer Support: https://developers.facebook.com/support
- Database issues: Check Render database dashboard

### Maintenance Schedule:
- **Weekly**: Review logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and optimize database performance
- **Annually**: Review architecture and scaling needs

---

## 🎉 Deployment Complete!

Once all checklist items are completed, your AutoPost VN application will be running reliably in production on Render with automatic Facebook posting every 5 minutes.

**Next Steps:**
1. Monitor initial deployment for 24-48 hours
2. Gather user feedback and usage metrics
3. Plan feature enhancements based on analytics
4. Scale resources as user base grows

**🚀 Congratulations! Your AutoPost VN is now live!**

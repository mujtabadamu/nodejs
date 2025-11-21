# ✅ Deployment Checklist

Use this checklist to ensure everything is ready for deployment and nothing is missed!

---

## 📋 Pre-Deployment Checklist

### 1. Code Preparation

- [ ] Code is committed to Git
- [ ] All dependencies in `package.json` are correct
- [ ] `.gitignore` includes `.env` and `node_modules`
- [ ] Build scripts work: `npm run build`
- [ ] Start script works: `npm start`
- [ ] TypeScript compiles without errors

**Test locally:**
```bash
cd /Users/mac/Documents/stuff/new-app
npm run build
npm start
```

### 2. Environment Variables

- [ ] Created `.env` file for local testing (use `ENV_TEMPLATE.md`)
- [ ] Generated secure JWT_SECRET (64+ characters)
- [ ] Database credentials ready
- [ ] CORS_ORIGIN configured
- [ ] API keys ready (GROQ, OpenAI if needed)

**Generate JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Database

- [ ] PostgreSQL database available (local or hosted)
- [ ] Database name created: `express_crud`
- [ ] Database credentials work
- [ ] Tables will auto-create on first run

**Test connection locally:**
```bash
psql -h localhost -U postgres -d express_crud
```

### 4. Git Repository

- [ ] GitHub repository created
- [ ] Code pushed to main branch
- [ ] Repository is accessible

**Push to GitHub:**
```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## 🚀 Deployment Steps

### Choose Your Platform:

#### Option A: Render.com (Easiest)

**Step 1: Create Database**
- [ ] Go to render.com and sign up
- [ ] Create new PostgreSQL database
- [ ] Name: `location-tracker-db`
- [ ] Database: `express_crud`
- [ ] Plan: Free
- [ ] Copy Internal Database URL

**Step 2: Deploy Web Service**
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Add all environment variables (see ENV_TEMPLATE.md)
- [ ] Deploy!

**Step 3: Verify**
- [ ] Check logs for errors
- [ ] Visit your app URL
- [ ] Test API endpoints

---

#### Option B: Railway.app

**Step 1: Setup**
- [ ] Go to railway.app and sign up
- [ ] Create new project from GitHub repo
- [ ] Add PostgreSQL database

**Step 2: Configure**
- [ ] Set environment variables
- [ ] Configure build settings
- [ ] Deploy!

**Step 3: Verify**
- [ ] Check deployment logs
- [ ] Test API endpoints
- [ ] Monitor usage ($5 free credit)

---

#### Option C: Fly.io + Neon

**Step 1: Install Fly CLI**
- [ ] Install: `brew install flyctl`
- [ ] Login: `fly auth login`

**Step 2: Create Neon Database**
- [ ] Go to neon.tech
- [ ] Create PostgreSQL database
- [ ] Copy connection string

**Step 3: Deploy to Fly.io**
- [ ] Run: `fly launch`
- [ ] Set secrets: `fly secrets set KEY=value`
- [ ] Deploy: `fly deploy`

---

## ✅ Post-Deployment Checklist

### 1. Verify Deployment

- [ ] App is accessible at deployment URL
- [ ] Root endpoint works: `GET /`
- [ ] Database connected (check logs)
- [ ] No errors in deployment logs

**Test root endpoint:**
```bash
curl https://your-app.onrender.com/
```

### 2. Test API Endpoints

- [ ] `GET /` - Root endpoint works
- [ ] `POST /api/locations` - Can add locations
- [ ] `GET /api/locations` - Can fetch locations
- [ ] `GET /api/stats` - Statistics work

**Test adding a location:**
```bash
curl -X POST https://your-app.onrender.com/api/locations \
  -H "Content-Type: application/json" \
  -d '{"lat":37.7749,"lng":-122.4194,"timestamp":1234567890}'
```

**Test fetching locations:**
```bash
curl https://your-app.onrender.com/api/locations
```

### 3. Create Admin User

- [ ] Access shell/terminal in deployment platform
- [ ] Run: `npm run create-admin:default`
- [ ] Or create manually via database

**Default credentials:**
- Email: `admin@example.com`
- Password: `admin123`

**Change default password immediately!**

### 4. Test Authentication

- [ ] Can register new admin
- [ ] Can login and get JWT token
- [ ] Protected endpoints require auth
- [ ] JWT token works

**Test login:**
```bash
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### 5. Database Verification

- [ ] Tables created automatically
- [ ] Can insert data
- [ ] Can query data
- [ ] Foreign keys work

**Check tables in database:**
```sql
\dt
-- Should show: locations, admin_users, user_profiles, etc.
```

### 6. Security Configuration

- [ ] JWT_SECRET is strong and unique
- [ ] Database password is secure
- [ ] CORS_ORIGIN restricted to frontend URL (not `*`)
- [ ] HTTPS enabled (automatic on most platforms)
- [ ] Environment variables are secure

**Update CORS for production:**
```
CORS_ORIGIN=https://your-frontend-app.vercel.app
```

### 7. Frontend Integration

- [ ] Update frontend API URL to deployment URL
- [ ] Test frontend can connect to backend
- [ ] CORS allows frontend requests
- [ ] All features work end-to-end

**In your frontend (vite-project):**
```typescript
const API_URL = 'https://your-app.onrender.com';
```

---

## 🔍 Monitoring & Maintenance

### Regular Checks

- [ ] Monitor logs for errors
- [ ] Check database usage
- [ ] Verify app is responding
- [ ] Monitor API response times
- [ ] Check free tier limits

### Free Tier Limitations

**Render.com:**
- [ ] Database expires after 90 days (backup data!)
- [ ] Web service spins down after inactivity (cold starts)
- [ ] Set up cron job to keep awake (optional)

**Railway.app:**
- [ ] Monitor $5 monthly credit usage
- [ ] Watch for usage alerts
- [ ] Add payment method to avoid service interruption

**Fly.io:**
- [ ] 3 VMs limit
- [ ] 160GB bandwidth/month
- [ ] Monitor with `fly status`

### Keep Service Active (Optional)

Use [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com) to ping your API:

- [ ] Create free account
- [ ] Add monitor for: `https://your-app.onrender.com/api/stats`
- [ ] Set interval: Every 10 minutes
- [ ] Prevents cold starts

---

## 🆘 Troubleshooting Checklist

### Build Failures

- [ ] Check `package.json` scripts are correct
- [ ] Verify all dependencies are listed
- [ ] Check Node version compatibility
- [ ] Review build logs for errors
- [ ] Try: Clear cache and rebuild

### Connection Issues

- [ ] Verify all environment variables set
- [ ] Check database is running
- [ ] Use Internal Database URL (not external)
- [ ] Check database connection string format
- [ ] Verify network access allowed

### Runtime Errors

- [ ] Check application logs
- [ ] Verify JWT_SECRET is set
- [ ] Check PORT is read from environment
- [ ] Verify database tables created
- [ ] Check for missing dependencies

### CORS Errors

- [ ] Verify CORS_ORIGIN set correctly
- [ ] Frontend using correct API URL
- [ ] Check preflight OPTIONS requests
- [ ] Verify allowed headers

### Database Issues

- [ ] Tables not created? Check initialization logs
- [ ] Connection timeout? Check database is active
- [ ] Auth failed? Verify credentials
- [ ] Can't connect? Check firewall/network rules

---

## 📊 Success Criteria

Your deployment is successful when:

- ✅ Backend is accessible at deployment URL
- ✅ All API endpoints respond correctly
- ✅ Database connected and working
- ✅ Admin user can login
- ✅ Frontend can communicate with backend
- ✅ HTTPS enabled
- ✅ No errors in logs
- ✅ All features working as expected

---

## 🎯 Final Steps

### 1. Documentation

- [ ] Update README with deployment URL
- [ ] Document environment variables
- [ ] Add API endpoint examples
- [ ] Create API documentation

### 2. Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Enable uptime monitoring
- [ ] Configure alerts for downtime
- [ ] Set up log aggregation

### 3. Backup

- [ ] Configure database backups
- [ ] Export data regularly
- [ ] Document backup/restore process
- [ ] Test restoration procedure

### 4. Security

- [ ] Change default admin password
- [ ] Review security headers
- [ ] Enable rate limiting (already in code)
- [ ] Set up IP whitelisting (if needed)

### 5. Performance

- [ ] Test API response times
- [ ] Monitor database query performance
- [ ] Set up caching (if needed)
- [ ] Configure CDN (if needed)

---

## 🎉 Deployment Complete!

Once all checkboxes are ticked, your backend is fully deployed and production-ready!

### Your Live URLs:

- **API:** `https://your-app.onrender.com`
- **Database:** Connected and working ✅
- **Status:** Live and monitored 🟢

### Quick Links:

- [Test API](https://your-app.onrender.com/)
- [View Logs](https://dashboard.render.com/web/your-service/logs)
- [Database Console](https://dashboard.render.com/d/your-database)

---

## 📚 Next Steps

1. ✅ Deploy frontend (Vercel, Netlify)
2. ✅ Add custom domain
3. ✅ Set up CI/CD pipeline
4. ✅ Implement monitoring
5. ✅ Add analytics
6. ✅ Create documentation
7. ✅ Set up staging environment

---

## 📞 Need Help?

- 📖 Read: `DEPLOYMENT_GUIDE.md` (full guide)
- ⚡ Quick start: `QUICK_DEPLOY.md` (5 minutes)
- 🔐 Environment: `ENV_TEMPLATE.md` (variables)
- 💬 Platform docs: Render, Railway, or Fly.io

---

**Congratulations! Your backend is now live! 🚀**

Print this checklist and check off items as you complete them!


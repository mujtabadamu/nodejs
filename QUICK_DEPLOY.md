# ⚡ Quick Deploy Guide - 5 Minutes

The fastest way to get your backend + database live!

---

## 🎯 Recommended: Render.com (Easiest)

### 1️⃣ Push to GitHub (2 minutes)

```bash
cd /Users/mac/Documents/stuff/new-app

# Initialize git if not done
git init
git add .
git commit -m "Ready for deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 2️⃣ Create Database on Render (1 minute)

1. Go to [render.com](https://render.com) → Sign up
2. Click **"New +"** → **"PostgreSQL"**
3. Settings:
   - Name: `location-tracker-db`
   - Database: `express_crud`
   - Plan: **Free**
4. Click **"Create Database"**
5. ✅ Done! Keep this tab open.

### 3️⃣ Deploy Backend (2 minutes)

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Settings:
   - Name: `location-tracker-backend`
   - Runtime: **Node**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: **Free**

4. Click **"Advanced"** → Add Environment Variables:

**Copy these from your database "Info" tab:**
```
DB_HOST=dpg-xxxxx.oregon-postgres.render.com
DB_PORT=5432
DB_DATABASE=express_crud
DB_USER=postgres
DB_PASSWORD=(copy from database info)
```

**Generate JWT secret in terminal:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Add these variables:**
```
NODE_ENV=production
PORT=3001
JWT_SECRET=(paste generated secret)
CORS_ORIGIN=*
```

**If using AI features, add:**
```
GROQ_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

5. Click **"Create Web Service"**

### 4️⃣ Wait for Deploy (~5 minutes)

- Watch the logs in Render dashboard
- Once you see "✅ Build successful"
- Your API is live! 🎉

### 5️⃣ Get Your URL

You'll see something like:
```
https://location-tracker-backend.onrender.com
```

### 6️⃣ Test It!

```bash
# Replace with YOUR URL
curl https://location-tracker-backend.onrender.com/

# Test adding a location
curl -X POST https://location-tracker-backend.onrender.com/api/locations \
  -H "Content-Type: application/json" \
  -d '{"lat":37.7749,"lng":-122.4194,"timestamp":1234567890}'
```

### 7️⃣ Create Admin User

In Render dashboard:
1. Go to your web service
2. Click **"Shell"** tab
3. Run:
```bash
npm run create-admin:default
```

**Default credentials:**
- Email: `admin@example.com`
- Password: `admin123`

---

## 🔥 That's It!

Your backend is now live with:
- ✅ PostgreSQL database
- ✅ RESTful API
- ✅ Admin authentication
- ✅ Location tracking
- ✅ Auto-deploys from Git

---

## 📱 Connect Your Frontend

Update your frontend to use the new backend URL:

```typescript
// In vite-project/src/utils/api.ts
const API_URL = 'https://location-tracker-backend.onrender.com';
```

Or use environment variable:

```bash
# In vite-project/.env
VITE_API_URL=https://location-tracker-backend.onrender.com
```

---

## 🚨 Important Notes

### Free Tier Limitations:
- **Database:** Expires after 90 days
- **Web Service:** Spins down after 15 min of inactivity (cold starts)
- **Cold Start:** First request after inactivity takes ~30 seconds

### Keep It Awake (Optional):
Use a service like [cron-job.org](https://cron-job.org) to ping your API every 10 minutes:
```
https://your-app.onrender.com/api/stats
```

---

## 🔄 Auto-Deploy

Every time you push to GitHub main branch, Render automatically redeploys:

```bash
git add .
git commit -m "Update feature"
git push origin main
# 🚀 Auto-deploys!
```

---

## 🆘 Troubleshooting

### Can't connect to database?
- Check environment variables in Render dashboard
- Use **Internal Database URL** (not external)
- Verify database is running

### Build failed?
- Check logs in Render dashboard
- Ensure `package.json` has correct scripts
- Try rebuilding: "Manual Deploy" → "Clear build cache & deploy"

### App crashes?
- Check logs for errors
- Verify all environment variables are set
- Check JWT_SECRET is present

---

## 📊 What You Get (Free)

| Feature | Render Free Tier |
|---------|-----------------|
| Web Service | ✅ 512 MB RAM |
| Database | ✅ PostgreSQL (90 days) |
| SSL/HTTPS | ✅ Automatic |
| Auto-Deploy | ✅ From GitHub |
| Custom Domain | ✅ Supported |
| Bandwidth | ✅ 100 GB/month |

---

## 🎯 Next Steps

1. ✅ Update CORS to your frontend URL
2. ✅ Change default admin password
3. ✅ Add custom domain (optional)
4. ✅ Set up monitoring
5. ✅ Enable database backups

---

## 🎉 You're Live!

Your backend API is now:
- 🌍 Accessible globally
- 🔒 Secured with HTTPS
- 🗄️ Connected to PostgreSQL
- 🚀 Auto-deploying from Git

**API URL:** `https://your-app.onrender.com`

---

## 📚 More Help

- Full deployment guide: `DEPLOYMENT_GUIDE.md`
- API documentation: `README.md`
- [Render Docs](https://render.com/docs)

**Need help?** Check the logs in Render dashboard first!


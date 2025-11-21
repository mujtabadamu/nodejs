# 🚀 Complete Deployment Guide - Backend + Database

This guide will walk you through deploying your backend API with PostgreSQL database to **free hosting providers**.

---

## 📌 Table of Contents

1. [Option 1: Render.com (Recommended)](#option-1-rendercom-recommended)
2. [Option 2: Railway.app](#option-2-railwayapp)
3. [Option 3: Fly.io + Neon Database](#option-3-flyio--neon-database)
4. [Post-Deployment Steps](#post-deployment-steps)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Option 1: Render.com (Recommended)

**Pros:** Easiest setup, free PostgreSQL + web service, auto-deploys from Git
**Cons:** Database expires after 90 days on free tier

### Step 1: Prepare Your Repository

1. **Initialize Git** (if not already):
   ```bash
   cd /Users/mac/Documents/stuff/new-app
   git init
   git add .
   git commit -m "Initial commit for deployment"
   ```

2. **Push to GitHub**:
   - Create a new repository on GitHub
   - Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Create PostgreSQL Database on Render

1. Go to [render.com](https://render.com) and sign up
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `location-tracker-db`
   - **Database:** `express_crud`
   - **User:** `postgres` (default)
   - **Region:** Choose closest to your users
   - **Plan:** Free
4. Click **"Create Database"**
5. **Save the connection details** (you'll need the Internal Database URL)

### Step 3: Deploy Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `location-tracker-backend`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable":
   
   ```
   NODE_ENV=production
   PORT=3001
   
   # Copy these from your database "Info" tab:
   DB_HOST=dpg-xxxxxxxxxxxxx-a.oregon-postgres.render.com
   DB_PORT=5432
   DB_DATABASE=express_crud
   DB_USER=postgres
   DB_PASSWORD=<from database connection info>
   
   # Generate a secure JWT secret (run this in terminal):
   # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   JWT_SECRET=<your_generated_secret_here>
   
   # CORS - change to your frontend URL later
   CORS_ORIGIN=*
   
   # If using AI features:
   GROQ_API_KEY=<your_groq_key>
   OPENAI_API_KEY=<your_openai_key>
   ```

5. Click **"Create Web Service"**

### Step 4: Wait for Deployment

- Render will build and deploy your app (5-10 minutes)
- Monitor the logs for any errors
- Once deployed, you'll get a URL like: `https://location-tracker-backend.onrender.com`

### Step 5: Test Your Deployment

```bash
# Test the root endpoint
curl https://your-app-name.onrender.com/

# Test location endpoint
curl -X POST https://your-app-name.onrender.com/api/locations \
  -H "Content-Type: application/json" \
  -d '{"lat":37.7749,"lng":-122.4194,"timestamp":1234567890}'
```

### Step 6: Create Admin User

You'll need to run the create-admin script. Two options:

**Option A - Using Render Shell:**
1. Go to your web service dashboard
2. Click "Shell" tab
3. Run:
   ```bash
   npm run create-admin:default
   ```

**Option B - Create via psql:**
1. Connect to your database from Render dashboard
2. Run this SQL (change password):
   ```sql
   INSERT INTO admin_users (username, email, password_hash)
   VALUES ('admin', 'admin@example.com', '$2b$10$...');
   ```

---

## 🚂 Option 2: Railway.app

**Pros:** Very developer-friendly, $5 free credit monthly, PostgreSQL included
**Cons:** Credit-based (usage limits)

### Step 1: Setup

1. Go to [railway.app](https://railway.app) and sign up
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Connect your GitHub repository

### Step 2: Add PostgreSQL

1. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway automatically creates the database

### Step 3: Configure Environment Variables

Railway will auto-populate some variables. Add these manually:

```
NODE_ENV=production
JWT_SECRET=<generate_secure_secret>
CORS_ORIGIN=*
GROQ_API_KEY=<your_key>
```

### Step 4: Configure Build Settings

1. Click on your service
2. Go to "Settings" → "Build"
3. Set:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** Leave blank

### Step 5: Deploy

- Railway will automatically deploy
- You'll get a URL like: `https://location-tracker-backend-production.up.railway.app`

---

## ✈️ Option 3: Fly.io + Neon Database

**Pros:** Good free tier, more control, excellent global CDN
**Cons:** Requires CLI, slightly more setup

### Step 1: Install Fly CLI

```bash
# macOS
brew install flyctl

# Or using curl
curl -L https://fly.io/install.sh | sh
```

### Step 2: Create Neon Database (Free PostgreSQL)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string:
   ```
   postgresql://user:password@host.region.neon.tech/dbname
   ```

### Step 3: Setup Fly.io

```bash
cd /Users/mac/Documents/stuff/new-app

# Login to Fly.io
fly auth login

# Launch app (follow prompts)
fly launch

# When prompted:
# - Choose app name
# - Choose region closest to your users
# - Don't add PostgreSQL (we're using Neon)
# - Don't deploy yet
```

### Step 4: Set Environment Variables

```bash
# Set secrets (one by one)
fly secrets set NODE_ENV=production
fly secrets set JWT_SECRET="your_secure_secret_here"
fly secrets set CORS_ORIGIN="*"

# Database connection (from Neon)
fly secrets set DB_HOST="your-host.neon.tech"
fly secrets set DB_PORT="5432"
fly secrets set DB_DATABASE="your_db_name"
fly secrets set DB_USER="your_user"
fly secrets set DB_PASSWORD="your_password"

# AI keys (if needed)
fly secrets set GROQ_API_KEY="your_key"
```

### Step 5: Deploy

```bash
# Deploy your app
fly deploy

# Check status
fly status

# View logs
fly logs
```

Your app will be available at: `https://your-app-name.fly.dev`

---

## ✅ Post-Deployment Steps

### 1. Create Admin User

**For Render/Railway:**
- Use the Shell/Terminal in the dashboard
- Run: `npm run create-admin:default`

**For Fly.io:**
```bash
fly ssh console
npm run create-admin:default
```

### 2. Update Frontend

Update your frontend API URL:

```typescript
// In your vite-project/src/utils/api.ts or config
const API_BASE_URL = process.env.VITE_API_URL || 'https://your-backend.onrender.com';
```

### 3. Configure CORS

Update the `CORS_ORIGIN` environment variable to your frontend URL:

```
CORS_ORIGIN=https://your-frontend-app.vercel.app
```

### 4. Test All Endpoints

```bash
# Set your backend URL
export API_URL="https://your-backend.onrender.com"

# Test root
curl $API_URL/

# Test locations
curl -X POST $API_URL/api/locations \
  -H "Content-Type: application/json" \
  -d '{"lat":37.7749,"lng":-122.4194,"timestamp":1234567890}'

# Test login
curl -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### 5. Monitor Your App

**Render:**
- Check logs in dashboard
- Set up email notifications for downtime

**Railway:**
- Monitor usage in dashboard (you have $5 credit/month)

**Fly.io:**
- Use `fly logs` to view logs
- Use `fly status` to check health

---

## 🔧 Troubleshooting

### Database Connection Issues

**Symptom:** "Unable to connect to database"

**Solutions:**
1. Check environment variables are set correctly
2. Verify database is running (check provider dashboard)
3. Check if database URL is internal (not external)
4. For Render: Use Internal Database URL, not External

### Build Failures

**Symptom:** Build fails during deployment

**Solutions:**
1. Check `package.json` scripts are correct:
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "node dist/index.js"
     }
   }
   ```
2. Ensure all dependencies are in `dependencies` (not devDependencies)
3. Check Node version compatibility

### App Crashes After Deployment

**Symptom:** App starts then crashes

**Solutions:**
1. Check logs for errors
2. Verify PORT is read from environment:
   ```typescript
   const PORT = process.env.PORT || 3001;
   ```
3. Check JWT_SECRET is set
4. Verify database tables are created (check initialization logs)

### CORS Errors

**Symptom:** Frontend can't connect to backend

**Solutions:**
1. Set CORS_ORIGIN to your frontend URL
2. Or use `*` for testing
3. Verify frontend is using HTTPS URL (not localhost)

### Free Tier Limitations

**Render:**
- Database expires after 90 days
- Web service spins down after inactivity (cold starts)

**Railway:**
- $5 credit/month (usage-based)
- Monitor usage in dashboard

**Fly.io:**
- Limited to 3 VMs
- 160GB bandwidth/month

---

## 🎉 Success Checklist

- [ ] Backend deployed and accessible
- [ ] Database connected and running
- [ ] Admin user created
- [ ] Can login and get JWT token
- [ ] Can create and fetch locations
- [ ] Frontend connected to backend
- [ ] CORS configured properly
- [ ] Environment variables secured
- [ ] Monitoring/logging setup

---

## 📊 Cost Summary (Free Tiers)

| Provider | Web Service | Database | Notes |
|----------|-------------|----------|-------|
| **Render** | ✅ Free | ✅ Free (90 days) | Best for quick start |
| **Railway** | ✅ $5 credit | ✅ Included | Best for flexibility |
| **Fly.io + Neon** | ✅ Free | ✅ Free | Best for production |

---

## 🔄 Continuous Deployment

All three providers support auto-deploy from Git:

1. Push to your `main` branch
2. Provider automatically detects changes
3. Rebuilds and redeploys
4. Zero downtime (most providers)

```bash
git add .
git commit -m "Update feature"
git push origin main
# Auto-deploys! 🚀
```

---

## 🆘 Need Help?

1. Check provider documentation:
   - [Render Docs](https://render.com/docs)
   - [Railway Docs](https://docs.railway.app)
   - [Fly.io Docs](https://fly.io/docs)

2. Check logs for specific errors
3. Verify all environment variables
4. Test database connection separately

---

## 🎯 Next Steps After Deployment

1. **Add Custom Domain** (most providers support free SSL)
2. **Set up Monitoring** (Sentry, LogRocket)
3. **Enable Backups** (especially important for free databases)
4. **Add Health Checks** endpoint
5. **Implement Rate Limiting** (already in your code!)
6. **Add Logging** (Winston, Morgan)

---

**You're all set! 🎉** Your backend is now live and accessible to the world!

Your API is now at: `https://your-app-name.onrender.com` (or similar)

Test it with:
```bash
curl https://your-app-name.onrender.com/api/locations
```


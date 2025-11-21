# 🔐 Environment Variables Template

Copy this to create your `.env` file for local development and use as reference for deployment.

---

## 📝 Create .env File

```bash
# In project root, create .env file
touch .env
```

Then copy the variables below:

---

## 🌍 Environment Variables

```env
# ====================================
# SERVER CONFIGURATION
# ====================================
PORT=3001
NODE_ENV=development

# ====================================
# DATABASE CONFIGURATION (PostgreSQL)
# ====================================
DB_USER=your_db_user
DB_HOST=localhost
DB_DATABASE=express_crud
DB_PASSWORD=your_db_password
DB_PORT=5432

# For local PostgreSQL on macOS:
# DB_USER=postgres
# DB_HOST=localhost
# DB_DATABASE=express_crud
# DB_PASSWORD=postgres
# DB_PORT=5432

# ====================================
# SECURITY
# ====================================
# IMPORTANT: Generate a strong random secret for production!
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_super_secret_jwt_key_at_least_64_characters_long_please_change_this_in_production

# ====================================
# CORS CONFIGURATION
# ====================================
# For development (allow all origins)
CORS_ORIGIN=*

# For production (specify your frontend URL)
# CORS_ORIGIN=https://your-frontend-app.vercel.app

# ====================================
# AI SERVICE KEYS (Optional)
# ====================================
# If you're using AI chat features
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_AI_KEY=your_google_ai_key_here

```

---

## 🚀 For Deployment (Render, Railway, Fly.io)

### Render.com Environment Variables:

```
NODE_ENV=production
PORT=3001

# Database (copy from Render PostgreSQL dashboard)
DB_HOST=dpg-xxxxxxxxxxxxx-a.oregon-postgres.render.com
DB_PORT=5432
DB_DATABASE=express_crud
DB_USER=postgres
DB_PASSWORD=<from_render_database_info>

# Security (generate new one!)
JWT_SECRET=<generate_with_crypto_random_bytes>

# CORS (your frontend URL)
CORS_ORIGIN=https://your-frontend.vercel.app

# AI Keys (if needed)
GROQ_API_KEY=<your_key>
OPENAI_API_KEY=<your_key>
```

### Railway.app Environment Variables:

Railway auto-populates database variables. Add these manually:

```
NODE_ENV=production
JWT_SECRET=<generate_secure_secret>
CORS_ORIGIN=https://your-frontend.vercel.app
GROQ_API_KEY=<your_key>
OPENAI_API_KEY=<your_key>
```

### Fly.io Secrets:

```bash
# Set secrets using Fly CLI
fly secrets set NODE_ENV=production
fly secrets set JWT_SECRET="your_secure_secret_here"
fly secrets set CORS_ORIGIN="https://your-frontend.vercel.app"

# Database (from Neon or other provider)
fly secrets set DB_HOST="your-host.neon.tech"
fly secrets set DB_PORT="5432"
fly secrets set DB_DATABASE="your_db_name"
fly secrets set DB_USER="your_user"
fly secrets set DB_PASSWORD="your_password"

# AI keys
fly secrets set GROQ_API_KEY="your_key"
fly secrets set OPENAI_API_KEY="your_key"
```

---

## 🔒 Generate Secure JWT Secret

Run this command to generate a cryptographically secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Example output:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

**Important:** Use a unique secret for production! Never reuse development secrets.

---

## 📋 Variable Descriptions

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3001` | Yes |
| `NODE_ENV` | Environment | `development` or `production` | Yes |
| `DB_USER` | Database username | `postgres` | Yes |
| `DB_HOST` | Database host | `localhost` or `dpg-xxx.render.com` | Yes |
| `DB_DATABASE` | Database name | `express_crud` | Yes |
| `DB_PASSWORD` | Database password | `your_password` | Yes |
| `DB_PORT` | Database port | `5432` | Yes |
| `JWT_SECRET` | Secret for JWT tokens | 64+ char random string | Yes |
| `CORS_ORIGIN` | Allowed origins | `*` or `https://app.com` | Yes |
| `GROQ_API_KEY` | Groq AI API key | `gsk_xxx` | Optional |
| `OPENAI_API_KEY` | OpenAI API key | `sk-xxx` | Optional |

---

## ⚠️ Security Best Practices

### ✅ DO:
- Generate unique JWT secrets for each environment
- Use strong database passwords (16+ characters)
- Restrict CORS to specific domains in production
- Keep `.env` in `.gitignore`
- Use different credentials for dev/staging/prod
- Rotate secrets periodically

### ❌ DON'T:
- Commit `.env` files to Git
- Use default/weak passwords
- Share production credentials
- Use `CORS_ORIGIN=*` in production
- Reuse secrets across projects
- Store secrets in code comments

---

## 🧪 Testing Environment Variables

Create a test script to verify your environment variables:

```bash
# test-env.js
require('dotenv').config();

console.log('✅ Environment Variables Check:\n');

const required = [
  'PORT',
  'NODE_ENV',
  'DB_USER',
  'DB_HOST',
  'DB_DATABASE',
  'DB_PASSWORD',
  'DB_PORT',
  'JWT_SECRET',
  'CORS_ORIGIN'
];

required.forEach(key => {
  const value = process.env[key];
  if (value) {
    console.log(`✓ ${key}: ${key.includes('PASSWORD') || key.includes('SECRET') ? '****' : value}`);
  } else {
    console.log(`✗ ${key}: MISSING!`);
  }
});
```

Run with:
```bash
node test-env.js
```

---

## 🔄 Multiple Environments

### Local Development (.env)
```env
NODE_ENV=development
DB_HOST=localhost
CORS_ORIGIN=*
```

### Staging (.env.staging)
```env
NODE_ENV=staging
DB_HOST=staging-db.provider.com
CORS_ORIGIN=https://staging-frontend.vercel.app
```

### Production (.env.production)
```env
NODE_ENV=production
DB_HOST=prod-db.provider.com
CORS_ORIGIN=https://app.yourdomain.com
```

Load specific env file:
```bash
node -r dotenv/config dist/index.js dotenv_config_path=.env.staging
```

---

## 📦 For Deployment Platforms

### Render.com
- Set in Dashboard → Service → Environment
- Supports secrets (hidden values)
- Can reference database connection with `fromDatabase`

### Railway.app
- Auto-populates database variables
- Set custom vars in Variables tab
- Supports templating: `${{SERVICE_NAME.VARIABLE}}`

### Fly.io
- Use `fly secrets set KEY=value`
- Secrets are encrypted
- List with `fly secrets list`

### Vercel (if using serverless)
- Set in Project Settings → Environment Variables
- Separate values for dev/preview/production
- Can import from `.env` file

---

## 🆘 Troubleshooting

### "JWT_SECRET is not defined"
Make sure you have:
```env
JWT_SECRET=your_secret_here
```

### "Cannot connect to database"
Check all DB_* variables are set:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_DATABASE=express_crud
```

### "CORS error" from frontend
Update CORS_ORIGIN:
```env
# Development
CORS_ORIGIN=*

# Production
CORS_ORIGIN=https://your-frontend-domain.com
```

### Environment variables not loading
1. Check `.env` file exists in project root
2. Verify dotenv is configured in `index.ts`
3. Restart your server after changes
4. Check for typos in variable names

---

## 📚 Resources

- [dotenv documentation](https://github.com/motdotla/dotenv)
- [Node.js environment variables](https://nodejs.org/api/process.html#processenv)
- [12-factor app config](https://12factor.net/config)

---

**Remember:** Never commit `.env` files to Git! Always use `.env.example` as a template.


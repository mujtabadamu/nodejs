# 📍 Location Tracker Backend API

A production-ready REST API for tracking user locations with admin authentication. Built with Express.js, TypeScript, and PostgreSQL.

[![TypeScript](https://img.shields.io/badge/TypeScript-4.5+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/Express-5+-black.svg)](https://expressjs.com/)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment (create .env file)
cp .env.example .env  # Edit with your database credentials

# Start development server
npm run dev

# Create your first admin user
npm run create-admin
```

**That's it!** Your API is now running on http://localhost:3001

For detailed setup instructions, see [GETTING_STARTED_CHECKLIST.md](GETTING_STARTED_CHECKLIST.md)

---

## 📋 Features

- ✅ **Location Tracking** - Collect and store GPS coordinates
- ✅ **Real-time Statistics** - Track total locations and unique devices
- ✅ **Admin Authentication** - JWT-based secure authentication
- ✅ **Rate Limiting** - Prevent abuse with configurable limits
- ✅ **Input Validation** - Joi schemas for all inputs
- ✅ **PostgreSQL Database** - Reliable persistent storage
- ✅ **Type-Safe** - Full TypeScript implementation
- ✅ **CORS Support** - Cross-origin requests enabled
- ✅ **Auto Database Setup** - Tables created automatically

---

## 📡 API Endpoints

### Public Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| `POST` | `/api/locations` | Add a new location | 10/min |
| `GET` | `/api/locations` | Get all locations | None |
| `GET` | `/api/stats` | Get statistics | None |
| `POST` | `/api/auth/register` | Register admin | 5/15min |
| `POST` | `/api/auth/login` | Login admin | 5/15min |

### Protected Endpoints (Require JWT)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `DELETE` | `/api/locations` | Clear all locations | Required |
| `GET` | `/api/auth/me` | Get current admin | Required |

---

## 🔧 Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 5
- **Language:** TypeScript
- **Database:** PostgreSQL
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Validation:** Joi
- **Rate Limiting:** express-rate-limit
- **ORM:** Raw SQL with pg driver

---

## 📦 Project Structure

```
src/
├── config/          # Database configuration
├── controllers/     # Request handlers
├── data/           # Database setup scripts
├── middlewares/    # Custom middleware (auth, validation)
├── models/         # Database models
├── routes/         # API route definitions
└── utils/          # Utility scripts
```

---

## 🗄️ Database Schema

### Locations Table
```sql
id              SERIAL PRIMARY KEY
lat             DECIMAL(10, 8)    NOT NULL
lng             DECIMAL(11, 8)    NOT NULL
timestamp       BIGINT            NOT NULL
user_agent      TEXT
collected_at    TIMESTAMP         DEFAULT NOW()
```

### Admin Users Table
```sql
id              SERIAL PRIMARY KEY
username        VARCHAR(100)      UNIQUE NOT NULL
email           VARCHAR(255)      UNIQUE NOT NULL
password_hash   TEXT              NOT NULL
created_at      TIMESTAMP         DEFAULT NOW()
updated_at      TIMESTAMP         DEFAULT NOW()
```

---

## 🔒 Security

- **Password Hashing:** bcrypt with 10 salt rounds
- **JWT Tokens:** 7-day expiration
- **Rate Limiting:** Per-endpoint configuration
- **Input Validation:** All inputs validated with Joi
- **SQL Injection:** Protected via parameterized queries
- **CORS:** Configurable allowed origins
- **Constraints:** Database-level validation for lat/lng ranges

---

## 📚 Documentation

- **[GETTING_STARTED_CHECKLIST.md](GETTING_STARTED_CHECKLIST.md)** - Step-by-step setup guide
- **[QUICK_START.md](QUICK_START.md)** - Quick reference guide
- **[API_SETUP.md](API_SETUP.md)** - Complete API documentation
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical implementation details

---

## 🧪 Testing

### Test with cURL

```bash
# Add a location
curl -X POST http://localhost:3001/api/locations \
  -H "Content-Type: application/json" \
  -d '{"lat":37.7749,"lng":-122.4194}'

# Get all locations
curl http://localhost:3001/api/locations

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'

# Clear locations (with token)
curl -X DELETE http://localhost:3001/api/locations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔧 Configuration

Create a `.env` file with the following variables:

```env
# Server
PORT=3001

# Database
DB_USER=your_db_user
DB_HOST=localhost
DB_DATABASE=express-crud
DB_PASSWORD=your_db_password
DB_PORT=5432

# Security
JWT_SECRET=your_super_secret_jwt_key_64+_characters

# CORS
CORS_ORIGIN=http://localhost:5173

# Environment
NODE_ENV=development
```

---

## 🎯 Frontend Integration

This backend is designed to work with the React frontend in the `vite-project` directory.

### Claim Page Integration
```typescript
// Send location to backend
await fetch('http://localhost:3001/api/locations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ lat, lng, timestamp: Date.now() })
});
```

### Tracker Page Integration
```typescript
// Fetch locations (with real-time updates)
const response = await fetch('http://localhost:3001/api/locations');
const { locations } = await response.json();
```

### Admin Authentication
```typescript
// Login and get JWT token
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token } = await response.json();
localStorage.setItem('adminToken', token);
```

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in development mode (with auto-reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Create admin user
npm run create-admin
```

---

## 📊 API Response Examples

### Add Location
```json
{
  "success": true,
  "location": {
    "id": "123",
    "lat": 37.7749,
    "lng": -122.4194,
    "timestamp": 1704067200000,
    "userAgent": "Mozilla/5.0...",
    "collectedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Get Statistics
```json
{
  "success": true,
  "totalLocations": 42,
  "uniqueDevices": 18,
  "latestLocation": {
    "id": "123",
    "lat": 37.7749,
    "lng": -122.4194,
    "timestamp": 1704067200000,
    "userAgent": "Mozilla/5.0...",
    "collectedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

---

## 🚢 Production Deployment

**Ready to deploy?** We've prepared comprehensive deployment guides for you!

### 🚀 Quick Start
- **[START_HERE.md](START_HERE.md)** - Overview and getting started
- **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** - Deploy in 5 minutes to Render.com
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete guide for all platforms
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Track your deployment progress
- **[PLATFORM_COMPARISON.md](PLATFORM_COMPARISON.md)** - Compare hosting providers
- **[ENV_TEMPLATE.md](ENV_TEMPLATE.md)** - Environment variables guide
- **[DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)** - Complete overview

### 🎯 Recommended Free Hosting Providers
1. **Render.com** (Easiest) - 5 minutes setup
2. **Railway.app** (Best UX) - $5 free credit monthly
3. **Fly.io + Neon** (Production) - Never expires

### Before deploying:

1. ✅ Use a strong random JWT_SECRET (64+ characters)
2. ✅ Enable HTTPS (automatic on all platforms)
3. ✅ Set proper CORS origins (not "*")
4. ✅ Use environment-specific database
5. ✅ Set up database backups
6. ✅ Implement logging (Winston, Morgan)
7. ✅ Add monitoring and alerting
8. ✅ Review and adjust rate limits
9. ✅ Enable helmet.js security headers
10. ✅ Set up CI/CD pipeline (automatic with Git)

---

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
- Ensure PostgreSQL is running: `pg_isready`
- Check credentials in `.env`
- Verify database exists: `psql -l | grep express-crud`

**JWT Secret Error**
- Add `JWT_SECRET` to `.env` file
- Use a strong random string (64+ chars)

**CORS Error**
- Set `CORS_ORIGIN` in `.env` to match frontend URL
- Default: `http://localhost:5173`

**Port Already in Use**
- Change `PORT` in `.env`
- Or kill process: `lsof -ti:3001 | xargs kill`

---

## 📝 License

ISC

---

## 🤝 Support

For issues and questions:
1. Check the documentation in the `docs/` folder
2. Review the [GETTING_STARTED_CHECKLIST.md](GETTING_STARTED_CHECKLIST.md)
3. Check server logs for error messages
4. Verify environment variables are set correctly

---

## ✨ What's Next?

- [ ] Add pagination for large location datasets
- [ ] Implement location filtering (by date, area)
- [ ] Add bulk operations
- [ ] Create admin dashboard
- [ ] Add data export features (CSV, JSON)
- [ ] Implement WebSocket for real-time updates
- [ ] Add email notifications
- [ ] Create mobile app integration

---

**Built with ❤️ using TypeScript and Express.js**

🎯 **Ready to track locations!** Start the server with `npm run dev`


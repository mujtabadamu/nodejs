import express, { Request, Response } from "express";
import userRoute from "./routes/users";
import locationRoute from "./routes/locations";
import authRoute from "./routes/auth";
import chatRoute from "./routes/chat";
import adminRoute from "./routes/admin";
import userChatRoute from "./routes/userChat";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import pool from "./config/db";
import errorHandler from "./middlewares/errorHandler";
import createUserTable from "./data/createUserTable";
import createTables from "./data/createTables";
import createAITables from "./data/createAITables";
import migrateAddUserIdAndTitle from "./data/migrateAddUserIdAndTitle";
import migrateAddRiskLevel from "./data/migrateAddRiskLevel";

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '../.env') });


const app = express();
const PORT = process.env.PORT || 3001; // Changed to 3001 as per API docs

// Middleware
app.use(express.json());

// CORS configuration - allow all origins in dev, specific origins in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CORS_ORIGIN || 'https://nodejs-37kv.onrender.com').split(',')
    : true, // Allow all origins in development
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Routes (order matters - more specific routes first!)
app.use("/api", authRoute);
app.use("/api", userChatRoute); // Must come before userRoute to avoid conflict
app.use("/api", chatRoute);
app.use("/api", adminRoute);
app.use("/api", locationRoute);
app.use("/api", userRoute);

// Error handling middleware
app.use(errorHandler);

// Database initialization
const initDatabase = async () => {
  try {
    await createUserTable();
    await createTables();
    await createAITables();
    // Run migrations for existing databases
    await migrateAddUserIdAndTitle();
    await migrateAddRiskLevel();
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
};

initDatabase();

console.log("🔧 Using database:", process.env.DB_DATABASE);

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT current_database()");
    res.json({
      success: true,
      message: "Location Tracker API",
      database: result.rows[0].current_database,
      endpoints: {
        locations: "/api/locations",
        stats: "/api/stats",
        auth: "/api/auth",
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Location API: http://localhost:${PORT}/api/locations`);
  console.log(`📊 Stats API: http://localhost:${PORT}/api/stats`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
});


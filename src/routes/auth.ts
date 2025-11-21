import { Router } from "express";
import authController from "../controllers/authController";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiter for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 5, // More lenient in dev
  message: { error: "Too many authentication attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost in development
    const ip = req.ip || '';
    return process.env.NODE_ENV === 'development' && 
           (ip === '127.0.0.1' || ip === '::1' || ip.includes('localhost'));
  }
});

// All endpoints temporarily public for testing
router.post("/auth/register", authLimiter, authController.register.bind(authController));
router.post("/auth/login", authLimiter, authController.login.bind(authController));
router.get("/auth/me", authController.getMe.bind(authController));

export default router;


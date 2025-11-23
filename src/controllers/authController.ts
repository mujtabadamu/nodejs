import { Request, Response } from "express";
import adminModel from "../models/adminModel";
import adminLoginModel from "../models/adminLoginModel";
import jwt from "jsonwebtoken";
import Joi from "joi";

class AuthController {
  // Validation schemas
  private registerSchema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  private loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  // Generate JWT token
  private generateToken(admin: { id: number; username: string; email: string }): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    return jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
      jwtSecret,
      { expiresIn: "7d" } // Token expires in 7 days
    );
  }

  // POST /api/auth/register - Register new admin
  async register(req: Request, res: Response) {
    try {
      // Validate request body
      const { error, value } = this.registerSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: error.details[0].message 
        });
      }

      const { username, email, password } = value;

      // Check if email already exists
      const existingEmail = await adminModel.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ 
          error: "Email already registered" 
        });
      }

      // Check if username already exists
      const existingUsername = await adminModel.findByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ 
          error: "Username already taken" 
        });
      }

      // Create new admin
      const admin = await adminModel.createAdmin({
        username,
        email,
        password,
      });

      // Generate token
      const token = this.generateToken({
        id: admin.id,
        username: admin.username,
        email: admin.email,
      });

      res.status(201).json({
        success: true,
        message: "Admin registered successfully",
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
        },
      });
    } catch (error: any) {
      console.error("Error registering admin:", error);
      res.status(500).json({ 
        error: "Failed to register admin",
        details: error.message 
      });
    }
  }

  // Helper to get client IP address
  private getClientIP(req: Request): string {
    // Check for forwarded IP (from proxy/load balancer)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }
    
    // Check for real IP header
    const realIP = req.headers['x-real-ip'];
    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }
    
    // Fallback to socket remote address
    return req.socket.remoteAddress || req.ip || 'unknown';
  }

  // POST /api/auth/login - Login admin
  async login(req: Request, res: Response) {
    let adminId: number | null = null;
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    try {
      // Validate request body
      const { error, value } = this.loginSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: error.details[0].message 
        });
      }

      const { email, password } = value;

      // Find admin by email
      const admin = await adminModel.findByEmail(email);
      if (!admin) {
        // Log failed login attempt (no admin found)
        await adminLoginModel.logLogin({
          adminId: 0, // Use 0 for unknown admin
          ipAddress,
          userAgent,
          success: false,
          failureReason: 'Email not found',
        });
        
        return res.status(401).json({ 
          error: "Invalid credentials" 
        });
      }

      adminId = admin.id;

      // Verify password
      const isValidPassword = await adminModel.verifyPassword(password, admin.password_hash);
      if (!isValidPassword) {
        // Log failed login attempt (wrong password)
        await adminLoginModel.logLogin({
          adminId: admin.id,
          ipAddress,
          userAgent,
          success: false,
          failureReason: 'Invalid password',
        });
        
        return res.status(401).json({ 
          error: "Invalid credentials" 
        });
      }

      // Generate token
      const token = this.generateToken({
        id: admin.id,
        username: admin.username,
        email: admin.email,
      });

      // Log successful login
      await adminLoginModel.logLogin({
        adminId: admin.id,
        ipAddress,
        userAgent,
        success: true,
      });

      console.log(`✅ Admin login successful: ${admin.email} from ${ipAddress}`);

      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
        },
      });
    } catch (error: any) {
      console.error("Error logging in:", error);
      
      // Log failed login attempt (server error) if we have an admin ID
      if (adminId) {
        try {
          await adminLoginModel.logLogin({
            adminId,
            ipAddress,
            userAgent,
            success: false,
            failureReason: 'Server error',
          });
        } catch (logError) {
          console.error("Failed to log login attempt:", logError);
        }
      }
      
      res.status(500).json({ 
        error: "Failed to login",
        details: error.message 
      });
    }
  }

  // GET /api/auth/me - Get current admin info
  async getMe(req: any, res: Response) {
    try {
      // admin info is attached by authMiddleware
      const admin = req.admin;
      
      if (!admin) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      res.status(200).json({
        success: true,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
        },
      });
    } catch (error: any) {
      console.error("Error getting admin info:", error);
      res.status(500).json({ 
        error: "Failed to get admin info",
        details: error.message 
      });
    }
  }
}

export default new AuthController();


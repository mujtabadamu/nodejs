import { Request, Response } from "express";
import adminModel from "../models/adminModel";
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

  // POST /api/auth/login - Login admin
  async login(req: Request, res: Response) {
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
        return res.status(401).json({ 
          error: "Invalid credentials" 
        });
      }

      // Verify password
      const isValidPassword = await adminModel.verifyPassword(password, admin.password_hash);
      if (!isValidPassword) {
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


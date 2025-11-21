import { Request, Response } from "express";
import pool from "../config/db";
import userProfileModel from "../models/userProfileModel";
import chatModel from "../models/chatModel";
import { analyzeUserData, askAboutUser } from "../services/adminAIService";
import Joi from "joi";

class AdminController {
  // Validation schemas
  private aiQuerySchema = Joi.object({
    deviceId: Joi.string().required(),
    question: Joi.string().min(3).max(500).required(),
  });

  // GET /api/admin/user/:deviceId - Get complete user details
  async getUserDetails(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;

      if (!deviceId) {
        return res.status(400).json({
          error: "Device ID is required",
        });
      }

      // Get location data
      const locationQuery = `
        SELECT * FROM locations WHERE device_id = $1 LIMIT 1
      `;
      const locationResult = await pool.query(locationQuery, [deviceId]);

      if (locationResult.rows.length === 0) {
        return res.status(404).json({
          error: "User not found",
          message: "No location data found for this device",
        });
      }

      const location = locationResult.rows[0];

      // Get user profile
      const profile = await userProfileModel.getProfile(deviceId);

      // Get all conversations
      const conversations = await chatModel.getUserConversations(deviceId);

      // Get all messages for all conversations
      const allMessages = [];
      for (const conv of conversations) {
        if (conv.id) {
          const messages = await chatModel.getConversationHistory(conv.id);
          allMessages.push({
            conversation: conv,
            messages,
          });
        }
      }

      // Calculate stats
      const totalMessages = allMessages.reduce(
        (sum, conv) => sum + conv.messages.length,
        0
      );
      const activeConversation = conversations.find((c) => c.isActive);

      res.status(200).json({
        success: true,
        user: {
          deviceId: location.device_id,
          location: {
            ipAddress: location.ip_address,
            city: location.city,
            region: location.region,
            country: location.country,
            countryCode: location.country_code,
            isp: location.isp,
            timezone: location.timezone,
            coordinates: {
              lat: parseFloat(location.lat),
              lng: parseFloat(location.lng),
            },
            isLocal: location.is_local,
          },
          tracking: {
            firstSeen: location.first_seen,
            lastSeen: location.last_seen,
            visitCount: parseInt(location.visit_count),
            userAgent: location.user_agent,
          },
          profile: profile || null,
          conversations: allMessages,
          stats: {
            totalConversations: conversations.length,
            activeConversation: activeConversation || null,
            totalMessages,
            profileCompletion: profile?.profileCompletion || 0,
          },
        },
      });
    } catch (error: any) {
      console.error("Error getting user details:", error);
      res.status(500).json({
        error: "Failed to get user details",
        details: error.message,
      });
    }
  }

  // POST /api/admin/ai/analyze/:deviceId - Analyze user data with AI
  async analyzeUser(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;

      // Get user profile
      const profile = await userProfileModel.getProfile(deviceId);

      if (!profile) {
        return res.status(404).json({
          error: "User profile not found",
        });
      }

      // Get all conversations
      const conversations = await chatModel.getUserConversations(deviceId);

      // Get all messages
      const allMessages = [];
      for (const conv of conversations) {
        if (conv.id) {
          const messages = await chatModel.getConversationHistory(conv.id);
          allMessages.push(...messages);
        }
      }

      // Generate AI analysis
      const analysis = await analyzeUserData(profile, allMessages);

      res.status(200).json({
        success: true,
        analysis,
      });
    } catch (error: any) {
      console.error("Error analyzing user:", error);
      res.status(500).json({
        error: "Failed to analyze user data",
        details: error.message,
      });
    }
  }

  // POST /api/admin/ai/query - Ask AI about user data
  async queryUserData(req: Request, res: Response) {
    try {
      const { error, value } = this.aiQuerySchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          error: error.details[0].message,
        });
      }

      const { deviceId, question } = value;

      // Get user profile
      const profile = await userProfileModel.getProfile(deviceId);

      if (!profile) {
        return res.status(404).json({
          error: "User profile not found",
        });
      }

      // Get all conversations
      const conversations = await chatModel.getUserConversations(deviceId);

      // Get all messages
      const allMessages = [];
      for (const conv of conversations) {
        if (conv.id) {
          const messages = await chatModel.getConversationHistory(conv.id);
          allMessages.push(...messages);
        }
      }

      // Ask AI about the user
      const answer = await askAboutUser(question, profile, allMessages);

      res.status(200).json({
        success: true,
        question,
        answer,
      });
    } catch (error: any) {
      console.error("Error querying user data:", error);
      res.status(500).json({
        error: "Failed to query user data",
        details: error.message,
      });
    }
  }

  // GET /api/admin/stats - Get overall admin statistics
  async getAdminStats(req: Request, res: Response) {
    try {
      // Total users
      const usersQuery = `SELECT COUNT(DISTINCT device_id) as total FROM locations`;
      const usersResult = await pool.query(usersQuery);
      const totalUsers = parseInt(usersResult.rows[0].total);

      // Total conversations
      const convsQuery = `SELECT COUNT(*) as total FROM chat_conversations`;
      const convsResult = await pool.query(convsQuery);
      const totalConversations = parseInt(convsResult.rows[0].total);

      // Total messages
      const msgsQuery = `SELECT COUNT(*) as total FROM chat_messages`;
      const msgsResult = await pool.query(msgsQuery);
      const totalMessages = parseInt(msgsResult.rows[0].total);

      // Users with profiles
      const profilesQuery = `SELECT COUNT(*) as total FROM user_profiles WHERE name IS NOT NULL`;
      const profilesResult = await pool.query(profilesQuery);
      const usersWithProfiles = parseInt(profilesResult.rows[0].total);

      // Active conversations
      const activeQuery = `SELECT COUNT(*) as total FROM chat_conversations WHERE is_active = true`;
      const activeResult = await pool.query(activeQuery);
      const activeConversations = parseInt(activeResult.rows[0].total);

      // Top countries
      const countriesQuery = `
        SELECT country, COUNT(*) as count
        FROM locations
        GROUP BY country
        ORDER BY count DESC
        LIMIT 5
      `;
      const countriesResult = await pool.query(countriesQuery);

      // Recent activity
      const recentQuery = `
        SELECT device_id, last_seen
        FROM locations
        ORDER BY last_seen DESC
        LIMIT 10
      `;
      const recentResult = await pool.query(recentQuery);

      res.status(200).json({
        success: true,
        stats: {
          totalUsers,
          totalConversations,
          totalMessages,
          usersWithProfiles,
          activeConversations,
          topCountries: countriesResult.rows,
          recentActivity: recentResult.rows,
        },
      });
    } catch (error: any) {
      console.error("Error getting admin stats:", error);
      res.status(500).json({
        error: "Failed to get admin stats",
        details: error.message,
      });
    }
  }
}

export default new AdminController();


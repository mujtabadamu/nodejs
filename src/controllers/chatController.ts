import { Request, Response } from "express";
import chatModel from "../models/chatModel";
import userProfileModel from "../models/userProfileModel";
import { chatWithAI, getAvatarGreeting, generateConversationTitle, AvatarType, AI_AVATARS } from "../services/aiService";
import Joi from "joi";

class ChatController {
  // Validation schemas
  private startChatSchema = Joi.object({
    deviceId: Joi.string().required(),
    aiAvatar: Joi.string().valid("SOPHIA", "ALEX").required(),
  });

  private sendMessageSchema = Joi.object({
    deviceId: Joi.string().required(),
    message: Joi.string().min(1).max(1000).required(),
  });

  // POST /api/chat/start - Start new conversation
  async startChat(req: Request, res: Response) {
    try {
      const { error, value } = this.startChatSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: error.details[0].message 
        });
      }

      const { deviceId, aiAvatar } = value;

      // IMPORTANT: Ensure device exists in locations table first
      // (chat_conversations has FK to locations table)
      const locationCheck = await chatModel.ensureDeviceTracked(deviceId, req);
      
      if (!locationCheck) {
        return res.status(500).json({
          error: "Service initialization failed",
          message: "Unable to start chat at this time. Please try again in a moment.",
        });
      }

      // Check if active conversation exists
      const existingConversation = await chatModel.getActiveConversation(deviceId);
      
      if (existingConversation) {
        // End previous conversation
        await chatModel.endConversation(existingConversation.id!);
      }

      // Create new conversation
      const conversation = await chatModel.createConversation(deviceId, aiAvatar);

      // Get or create user profile
      await userProfileModel.getOrCreateProfile(deviceId);

      // Get AI greeting
      const greeting = getAvatarGreeting(aiAvatar as AvatarType);

      // Add AI greeting as first message
      await chatModel.addMessage({
        conversationId: conversation.id!,
        deviceId,
        role: "assistant",
        content: greeting,
      });

      res.status(201).json({
        success: true,
        conversation: {
          id: conversation.id,
          aiAvatar: conversation.aiAvatar,
          greeting,
        },
      });
    } catch (error: any) {
      console.error("Error starting chat:", error);
      res.status(500).json({ 
        error: "Failed to start chat",
        details: error.message 
      });
    }
  }

  // POST /api/chat/message - Send message and get AI response
  async sendMessage(req: Request, res: Response) {
    try {
      const { error, value } = this.sendMessageSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: error.details[0].message 
        });
      }

      const { deviceId, message } = value;

      // Get active conversation
      const conversation = await chatModel.getActiveConversation(deviceId);

      if (!conversation) {
        return res.status(404).json({
          error: "No active conversation found",
          message: "Please start a new conversation first",
        });
      }

      // Save user message
      const userMessage = await chatModel.addMessage({
        conversationId: conversation.id!,
        deviceId,
        role: "user",
        content: message,
      });

      // Get conversation history for context
      const history = await chatModel.getConversationHistory(conversation.id!);
      
      // Format history for AI
      const conversationHistory = history.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Get AI response
      const aiResponse = await chatWithAI(
        conversation.aiAvatar as AvatarType,
        message,
        conversationHistory
      );

      // Save AI response
      const assistantMessage = await chatModel.addMessage({
        conversationId: conversation.id!,
        deviceId,
        role: "assistant",
        content: aiResponse.response,
        extractedInfo: aiResponse.extractedInfo,
      });

      // Update user profile if info was extracted
      if (aiResponse.extractedInfo) {
        console.log("📝 Extracted info:", aiResponse.extractedInfo);
        await userProfileModel.updateProfile(deviceId, aiResponse.extractedInfo);
      }

      // Auto-generate title if this is the first user message (messageCount = 2: greeting + first user message)
      if (conversation.messageCount === 1) {
        const title = await generateConversationTitle(message);
        await chatModel.updateConversationTitle(conversation.id!, title);
      }

      // Get updated profile
      const userProfile = await userProfileModel.getProfile(deviceId);

      res.status(200).json({
        success: true,
        userMessage: {
          id: userMessage.id,
          content: userMessage.content,
          timestamp: userMessage.timestamp,
        },
        aiMessage: {
          id: assistantMessage.id,
          content: assistantMessage.content,
          timestamp: assistantMessage.timestamp,
        },
        profileCompletion: userProfile?.profileCompletion || 0,
        extractedInfo: aiResponse.extractedInfo,
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      res.status(500).json({ 
        error: "Failed to send message",
        details: error.message 
      });
    }
  }

  // GET /api/chat/history/:deviceId - Get conversation history
  async getHistory(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;

      const conversation = await chatModel.getActiveConversation(deviceId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: "No active conversation found",
        });
      }

      const history = await chatModel.getConversationHistory(conversation.id!);

      res.status(200).json({
        success: true,
        conversation: {
          id: conversation.id,
          aiAvatar: conversation.aiAvatar,
          startedAt: conversation.startedAt,
          messageCount: conversation.messageCount,
        },
        messages: history.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      });
    } catch (error: any) {
      console.error("Error getting history:", error);
      res.status(500).json({ 
        error: "Failed to get history",
        details: error.message 
      });
    }
  }

  // GET /api/chat/profile/:deviceId - Get user profile
  async getUserProfile(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;

      const profile = await userProfileModel.getProfile(deviceId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: "Profile not found",
        });
      }

      res.status(200).json({
        success: true,
        profile,
      });
    } catch (error: any) {
      console.error("Error getting profile:", error);
      res.status(500).json({ 
        error: "Failed to get profile",
        details: error.message 
      });
    }
  }

  // GET /api/chat/avatars - Get available AI avatars
  async getAvatars(req: Request, res: Response) {
    try {
      const avatars = Object.entries(AI_AVATARS).map(([key, config]) => ({
        id: key,
        name: config.name,
        gender: config.gender,
        description: config.personality.split('\n')[0],
      }));

      res.status(200).json({
        success: true,
        avatars,
      });
    } catch (error: any) {
      console.error("Error getting avatars:", error);
      res.status(500).json({ 
        error: "Failed to get avatars",
        details: error.message 
      });
    }
  }

  // POST /api/chat/end - End active conversation
  async endChat(req: Request, res: Response) {
    try {
      const { deviceId } = req.body;

      if (!deviceId) {
        return res.status(400).json({
          error: "deviceId is required",
        });
      }

      const conversation = await chatModel.getActiveConversation(deviceId);

      if (!conversation) {
        return res.status(404).json({
          error: "No active conversation found",
        });
      }

      await chatModel.endConversation(conversation.id!);

      res.status(200).json({
        success: true,
        message: "Conversation ended",
      });
    } catch (error: any) {
      console.error("Error ending chat:", error);
      res.status(500).json({ 
        error: "Failed to end chat",
        details: error.message 
      });
    }
  }

  // GET /api/chat/admin/profiles - Get all user profiles (admin)
  async getAllProfiles(req: Request, res: Response) {
    try {
      const profiles = await userProfileModel.getAllProfiles();

      res.status(200).json({
        success: true,
        profiles,
        count: profiles.length,
      });
    } catch (error: any) {
      console.error("Error getting profiles:", error);
      res.status(500).json({ 
        error: "Failed to get profiles",
        details: error.message 
      });
    }
  }

  // GET /api/chat/admin/conversations - Get all conversations (admin)
  async getAllConversations(req: Request, res: Response) {
    try {
      const conversations = await chatModel.getAllConversations();

      res.status(200).json({
        success: true,
        conversations,
        count: conversations.length,
      });
    } catch (error: any) {
      console.error("Error getting conversations:", error);
      res.status(500).json({ 
        error: "Failed to get conversations",
        details: error.message 
      });
    }
  }

  // GET /api/chat/conversations/:deviceId - Get all conversations for a device
  async getUserConversations(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;

      if (!deviceId) {
        return res.status(400).json({
          error: "deviceId is required",
        });
      }

      const conversations = await chatModel.getUserConversations(deviceId);

      // Get preview of last message for each conversation
      const conversationsWithPreviews = await Promise.all(
        conversations.map(async (conv) => {
          const messages = await chatModel.getConversationHistory(conv.id!);
          const lastMessage = messages[messages.length - 1];
          
          return {
            id: conv.id,
            title: conv.title || "New Conversation",
            aiAvatar: conv.aiAvatar,
            lastMessageAt: conv.lastMessageAt,
            messageCount: conv.messageCount,
            isActive: conv.isActive,
            preview: lastMessage?.content.substring(0, 100) || "",
          };
        })
      );

      res.status(200).json({
        success: true,
        conversations: conversationsWithPreviews,
      });
    } catch (error: any) {
      console.error("Error getting user conversations:", error);
      res.status(500).json({ 
        error: "Failed to get conversations",
        details: error.message 
      });
    }
  }

  // GET /api/chat/conversation/:conversationId - Get specific conversation with messages
  async getConversationById(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const { deviceId } = req.query;

      if (!deviceId) {
        return res.status(400).json({
          error: "deviceId is required",
        });
      }

      const conversation = await chatModel.getConversationByIdWithDevice(
        parseInt(conversationId),
        deviceId as string
      );

      if (!conversation) {
        return res.status(404).json({
          error: "Conversation not found or access denied",
        });
      }

      const messages = await chatModel.getConversationHistory(conversation.id!);

      res.status(200).json({
        success: true,
        conversation: {
          id: conversation.id,
          title: conversation.title,
          aiAvatar: conversation.aiAvatar,
          startedAt: conversation.startedAt,
          lastMessageAt: conversation.lastMessageAt,
          messageCount: conversation.messageCount,
          isActive: conversation.isActive,
        },
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      });
    } catch (error: any) {
      console.error("Error getting conversation:", error);
      res.status(500).json({ 
        error: "Failed to get conversation",
        details: error.message 
      });
    }
  }

  // POST /api/chat/conversation/:conversationId/activate - Switch to a conversation
  async activateConversation(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const { deviceId } = req.body;

      if (!deviceId) {
        return res.status(400).json({
          error: "deviceId is required",
        });
      }

      // Verify conversation belongs to device
      const conversation = await chatModel.getConversationByIdWithDevice(
        parseInt(conversationId),
        deviceId
      );

      if (!conversation) {
        return res.status(404).json({
          error: "Conversation not found or access denied",
        });
      }

      // Set as active
      await chatModel.setActiveConversation(conversation.id!, deviceId);

      res.status(200).json({
        success: true,
        message: "Conversation activated",
      });
    } catch (error: any) {
      console.error("Error activating conversation:", error);
      res.status(500).json({ 
        error: "Failed to activate conversation",
        details: error.message 
      });
    }
  }

  // DELETE /api/chat/conversation/:conversationId - Delete a conversation
  async deleteConversation(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const { deviceId } = req.body;

      if (!deviceId) {
        return res.status(400).json({
          error: "deviceId is required",
        });
      }

      const deleted = await chatModel.deleteConversation(
        parseInt(conversationId),
        deviceId
      );

      if (!deleted) {
        return res.status(404).json({
          error: "Conversation not found or access denied",
        });
      }

      res.status(200).json({
        success: true,
        message: "Conversation deleted",
      });
    } catch (error: any) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ 
        error: "Failed to delete conversation",
        details: error.message 
      });
    }
  }
}

export default new ChatController();


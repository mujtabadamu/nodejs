import { Request, Response } from "express";
import chatModel from "../models/chatModel";
import { chatWithAI } from "../services/aiService";

/**
 * User Chat Controller - Handles authenticated user chat operations
 */
class UserChatController {
  /**
   * Get all conversations for authenticated user
   */
  async getUserConversations(req: Request, res: Response) {
    try {
      const userId = (req as any).userId; // From auth middleware
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      
      const conversations = await chatModel.getConversationsByUserId(userId);
      
      // Get first message for each conversation as preview
      const conversationsWithPreview = await Promise.all(
        conversations.map(async (conv) => {
          const messages = await chatModel.getConversationHistory(conv.id!);
          const firstUserMessage = messages.find(m => m.role === 'user');
          
          return {
            ...conv,
            preview: firstUserMessage?.content.substring(0, 60) || "New conversation",
          };
        })
      );
      
      res.json({
        success: true,
        conversations: conversationsWithPreview,
      });
    } catch (error: any) {
      console.error("❌ Error getting user conversations:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get conversations",
        error: error.message,
      });
    }
  }
  
  /**
   * Get specific conversation with messages
   */
  async getConversation(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const conversationId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      
      const conversation = await chatModel.getConversationById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }
      
      // Verify ownership
      if (conversation.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }
      
      const messages = await chatModel.getConversationHistory(conversationId);
      
      res.json({
        success: true,
        conversation,
        messages,
      });
    } catch (error: any) {
      console.error("❌ Error getting conversation:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get conversation",
        error: error.message,
      });
    }
  }
  
  /**
   * Create new conversation
   */
  async createConversation(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { deviceId, aiAvatar } = req.body;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      
      if (!deviceId || !aiAvatar) {
        return res.status(400).json({
          success: false,
          message: "Device ID and AI avatar required",
        });
      }
      
      // Ensure device is tracked
      await chatModel.ensureDeviceTracked(deviceId, req);
      
      // Create conversation
      const conversation = await chatModel.createConversation(deviceId, aiAvatar, userId);
      
      res.json({
        success: true,
        conversation,
      });
    } catch (error: any) {
      console.error("❌ Error creating conversation:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create conversation",
        error: error.message,
      });
    }
  }
  
  /**
   * Send message in conversation
   */
  async sendMessage(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const conversationId = parseInt(req.params.id);
      const { message, deviceId } = req.body;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      
      // Verify conversation ownership
      const conversation = await chatModel.getConversationById(conversationId);
      
      if (!conversation || conversation.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }
      
      // Save user message
      await chatModel.addMessage({
        conversationId,
        deviceId,
        role: "user",
        content: message,
      });
      
      // Get conversation history for context
      const history = await chatModel.getConversationHistory(conversationId);
      
      // Auto-generate title from first message
      if (history.length === 1) {
        const title = message.length > 50 
          ? message.substring(0, 47) + "..." 
          : message;
        await chatModel.updateConversationTitle(conversationId, title);
      }
      
      // Format conversation history for AI
      const formattedHistory = history.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      }));
      
      // Get AI response
      const aiResponse = await chatWithAI(
        conversation.aiAvatar as any,
        message,
        formattedHistory
      );
      
      res.json({
        success: true,
        response: aiResponse.response,
        conversationId,
      });
    } catch (error: any) {
      console.error("❌ Error sending message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send message",
        error: error.message,
      });
    }
  }
  
  /**
   * Delete conversation
   */
  async deleteConversation(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const conversationId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      
      const success = await chatModel.deleteConversation(conversationId, userId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found or unauthorized",
        });
      }
      
      res.json({
        success: true,
        message: "Conversation deleted",
      });
    } catch (error: any) {
      console.error("❌ Error deleting conversation:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete conversation",
        error: error.message,
      });
    }
  }
  
  /**
   * Link current conversation to user (when user logs in)
   */
  async linkConversation(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { conversationId } = req.body;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      
      await chatModel.linkConversationToUser(conversationId, userId);
      
      res.json({
        success: true,
        message: "Conversation linked to user",
      });
    } catch (error: any) {
      console.error("❌ Error linking conversation:", error);
      res.status(500).json({
        success: false,
        message: "Failed to link conversation",
        error: error.message,
      });
    }
  }
}

export default new UserChatController();


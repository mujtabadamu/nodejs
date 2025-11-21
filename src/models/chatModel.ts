import pool from "../config/db";
import { Request } from "express";
import locationModel from "./locationModel";
import { extractClientIP, cleanIPv6 } from "../utils/ipUtils";
import { getLocationFromIP } from "../services/ipGeolocation";

export interface ChatConversation {
  id?: number;
  deviceId: string;
  aiAvatar: string;
  userId?: number;
  title?: string;
  startedAt?: Date;
  lastMessageAt?: Date;
  messageCount?: number;
  isActive?: boolean;
}

export interface ChatMessage {
  id?: number;
  conversationId: number;
  deviceId: string;
  role: "user" | "assistant";
  content: string;
  extractedInfo?: any;
  timestamp?: Date;
}

class ChatModel {
  // Ensure device is tracked in locations table before creating conversation
  async ensureDeviceTracked(deviceId: string, req: Request): Promise<boolean> {
    try {
      // Check if device already exists in locations table
      const checkQuery = `SELECT id FROM locations WHERE device_id = $1 LIMIT 1`;
      const result = await pool.query(checkQuery, [deviceId]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Device ${deviceId.substring(0, 8)}... already tracked`);
        return true;
      }
      
      // Device not tracked yet - track it now
      console.log(`📍 Tracking new device ${deviceId.substring(0, 8)}...`);
      
      // Extract IP and get location
      let clientIP = extractClientIP(req);
      clientIP = cleanIPv6(clientIP);
      
      const ipLocation = await getLocationFromIP(clientIP);
      
      if (!ipLocation) {
        console.error("❌ Failed to get location for device");
        return false;
      }
      
      // Add to locations table
      await locationModel.addLocation({
        deviceId,
        ipAddress: ipLocation.ip,
        lat: ipLocation.lat,
        lng: ipLocation.lng,
        city: ipLocation.city,
        region: ipLocation.region,
        country: ipLocation.country,
        countryCode: ipLocation.countryCode,
        isp: ipLocation.isp,
        timezone: ipLocation.timezone,
        isLocal: ipLocation.isLocal,
        timestamp: Date.now(),
        userAgent: req.get("user-agent") || "Unknown",
      });
      
      console.log(`✅ Device tracked successfully: ${ipLocation.city}, ${ipLocation.country}`);
      return true;
      
    } catch (error: any) {
      console.error("❌ Error ensuring device tracked:", error.message);
      return false;
    }
  }
  // Create new conversation
  async createConversation(deviceId: string, aiAvatar: string, userId?: number): Promise<ChatConversation> {
    const query = `
      INSERT INTO chat_conversations (device_id, ai_avatar, user_id, message_count, title)
      VALUES ($1, $2, $3, 0, $4)
      RETURNING *
    `;
    
    const title = `New Conversation`;
    const result = await pool.query(query, [deviceId, aiAvatar, userId || null, title]);
    const row = result.rows[0];
    
    return {
      id: row.id,
      deviceId: row.device_id,
      aiAvatar: row.ai_avatar,
      userId: row.user_id,
      title: row.title,
      startedAt: row.started_at,
      lastMessageAt: row.last_message_at,
      messageCount: row.message_count,
      isActive: row.is_active,
    };
  }
  
  // Get active conversation for device
  async getActiveConversation(deviceId: string): Promise<ChatConversation | null> {
    const query = `
      SELECT * FROM chat_conversations
      WHERE device_id = $1 AND is_active = true
      ORDER BY last_message_at DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [deviceId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      deviceId: row.device_id,
      aiAvatar: row.ai_avatar,
      userId: row.user_id,
      title: row.title,
      startedAt: row.started_at,
      lastMessageAt: row.last_message_at,
      messageCount: row.message_count,
      isActive: row.is_active,
    };
  }
  
  // Get specific conversation by ID
  async getConversationById(conversationId: number): Promise<ChatConversation | null> {
    const query = `
      SELECT * FROM chat_conversations
      WHERE id = $1
      LIMIT 1
    `;
    
    const result = await pool.query(query, [conversationId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      deviceId: row.device_id,
      aiAvatar: row.ai_avatar,
      userId: row.user_id,
      title: row.title,
      startedAt: row.started_at,
      lastMessageAt: row.last_message_at,
      messageCount: row.message_count,
      isActive: row.is_active,
    };
  }
  
  // Add message to conversation
  async addMessage(message: ChatMessage): Promise<ChatMessage> {
    const messageQuery = `
      INSERT INTO chat_messages (conversation_id, device_id, role, content, extracted_info)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const messageResult = await pool.query(messageQuery, [
      message.conversationId,
      message.deviceId,
      message.role,
      message.content,
      message.extractedInfo ? JSON.stringify(message.extractedInfo) : null,
    ]);
    
    // Update conversation
    const updateQuery = `
      UPDATE chat_conversations
      SET last_message_at = NOW(), message_count = message_count + 1
      WHERE id = $1
    `;
    
    await pool.query(updateQuery, [message.conversationId]);
    
    const row = messageResult.rows[0];
    
    return {
      id: row.id,
      conversationId: row.conversation_id,
      deviceId: row.device_id,
      role: row.role,
      content: row.content,
      extractedInfo: row.extracted_info,
      timestamp: row.timestamp,
    };
  }
  
  // Get conversation history
  async getConversationHistory(conversationId: number): Promise<ChatMessage[]> {
    const query = `
      SELECT * FROM chat_messages
      WHERE conversation_id = $1
      ORDER BY timestamp ASC
    `;
    
    const result = await pool.query(query, [conversationId]);
    
    return result.rows.map(row => ({
      id: row.id,
      conversationId: row.conversation_id,
      deviceId: row.device_id,
      role: row.role,
      content: row.content,
      extractedInfo: row.extracted_info,
      timestamp: row.timestamp,
    }));
  }
  
  // End conversation
  async endConversation(conversationId: number): Promise<void> {
    const query = `
      UPDATE chat_conversations
      SET is_active = false
      WHERE id = $1
    `;
    
    await pool.query(query, [conversationId]);
  }
  
  // Get all conversations for device
  async getUserConversations(deviceId: string): Promise<ChatConversation[]> {
    const query = `
      SELECT * FROM chat_conversations
      WHERE device_id = $1
      ORDER BY last_message_at DESC
    `;
    
    const result = await pool.query(query, [deviceId]);
    
    return result.rows.map(row => ({
      id: row.id,
      deviceId: row.device_id,
      aiAvatar: row.ai_avatar,
      userId: row.user_id,
      title: row.title,
      startedAt: row.started_at,
      lastMessageAt: row.last_message_at,
      messageCount: row.message_count,
      isActive: row.is_active,
    }));
  }
  
  // Get all conversations for authenticated user
  async getConversationsByUserId(userId: number): Promise<ChatConversation[]> {
    const query = `
      SELECT * FROM chat_conversations
      WHERE user_id = $1
      ORDER BY last_message_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    return result.rows.map(row => ({
      id: row.id,
      deviceId: row.device_id,
      aiAvatar: row.ai_avatar,
      userId: row.user_id,
      title: row.title,
      startedAt: row.started_at,
      lastMessageAt: row.last_message_at,
      messageCount: row.message_count,
      isActive: row.is_active,
    }));
  }
  
  // Update conversation title (auto-generated from first message)
  async updateConversationTitle(conversationId: number, title: string): Promise<void> {
    const query = `
      UPDATE chat_conversations
      SET title = $1
      WHERE id = $2
    `;
    
    await pool.query(query, [title, conversationId]);
  }
  
  // Link conversation to user (when user logs in after starting chat)
  async linkConversationToUser(conversationId: number, userId: number): Promise<void> {
    const query = `
      UPDATE chat_conversations
      SET user_id = $1
      WHERE id = $2
    `;
    
    await pool.query(query, [userId, conversationId]);
  }
  
  // Set a conversation as active (deactivate others for that device)
  async setActiveConversation(conversationId: number, deviceId: string): Promise<void> {
    // Deactivate all conversations for this device
    const deactivateQuery = `
      UPDATE chat_conversations
      SET is_active = false
      WHERE device_id = $1
    `;
    await pool.query(deactivateQuery, [deviceId]);
    
    // Activate the specified conversation
    const activateQuery = `
      UPDATE chat_conversations
      SET is_active = true
      WHERE id = $1
    `;
    await pool.query(activateQuery, [conversationId]);
  }
  
  // Get conversation with device verification
  async getConversationByIdWithDevice(conversationId: number, deviceId: string): Promise<ChatConversation | null> {
    const query = `
      SELECT * FROM chat_conversations
      WHERE id = $1 AND device_id = $2
      LIMIT 1
    `;
    
    const result = await pool.query(query, [conversationId, deviceId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      deviceId: row.device_id,
      aiAvatar: row.ai_avatar,
      userId: row.user_id,
      title: row.title,
      startedAt: row.started_at,
      lastMessageAt: row.last_message_at,
      messageCount: row.message_count,
      isActive: row.is_active,
    };
  }
  
  // Delete conversation
  async deleteConversation(conversationId: number, deviceId?: string, userId?: number): Promise<boolean> {
    // If deviceId provided, verify ownership by device
    if (deviceId) {
      const checkQuery = `SELECT device_id FROM chat_conversations WHERE id = $1`;
      const result = await pool.query(checkQuery, [conversationId]);
      
      if (result.rows.length === 0 || result.rows[0].device_id !== deviceId) {
        return false;
      }
    }
    
    // If userId provided, verify ownership by user
    if (userId) {
      const checkQuery = `SELECT user_id FROM chat_conversations WHERE id = $1`;
      const result = await pool.query(checkQuery, [conversationId]);
      
      if (result.rows.length === 0 || result.rows[0].user_id !== userId) {
        return false;
      }
    }
    
    const query = `DELETE FROM chat_conversations WHERE id = $1`;
    const result = await pool.query(query, [conversationId]);
    
    return (result.rowCount ?? 0) > 0;
  }
  
  // Get all conversations (admin)
  async getAllConversations(): Promise<any[]> {
    const query = `
      SELECT 
        c.*,
        up.name as user_name,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id) as total_messages
      FROM chat_conversations c
      LEFT JOIN user_profiles up ON c.device_id = up.device_id
      ORDER BY c.last_message_at DESC
      LIMIT 100
    `;
    
    const result = await pool.query(query);
    
    return result.rows.map(row => ({
      id: row.id,
      deviceId: row.device_id,
      aiAvatar: row.ai_avatar,
      userName: row.user_name || "Anonymous",
      startedAt: row.started_at,
      lastMessageAt: row.last_message_at,
      messageCount: row.message_count,
      totalMessages: parseInt(row.total_messages),
      isActive: row.is_active,
    }));
  }
}

export default new ChatModel();


import { Router } from "express";
import chatController from "../controllers/chatController";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiter for chat endpoints
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Max 30 messages per minute
  message: { error: "Too many messages. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public chat endpoints
router.post("/chat/start", chatController.startChat.bind(chatController));
router.post("/chat/message", chatLimiter, chatController.sendMessage.bind(chatController));
router.post("/chat/end", chatController.endChat.bind(chatController));
router.get("/chat/history/:deviceId", chatController.getHistory.bind(chatController));
router.get("/chat/profile/:deviceId", chatController.getUserProfile.bind(chatController));
router.get("/chat/avatars", chatController.getAvatars.bind(chatController));

// Conversation management endpoints
router.get("/chat/conversations/:deviceId", chatController.getUserConversations.bind(chatController));
router.get("/chat/conversation/:conversationId", chatController.getConversationById.bind(chatController));
router.post("/chat/conversation/:conversationId/activate", chatController.activateConversation.bind(chatController));
router.delete("/chat/conversation/:conversationId", chatController.deleteConversation.bind(chatController));

// Admin endpoints (temporarily public for testing)
router.get("/chat/admin/profiles", chatController.getAllProfiles.bind(chatController));
router.get("/chat/admin/conversations", chatController.getAllConversations.bind(chatController));

export default router;


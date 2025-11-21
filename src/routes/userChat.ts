import express from "express";
import userChatController from "../controllers/userChatController";
import { authenticateUser } from "../middlewares/authMiddleware";

const router = express.Router();

// All authenticated user routes (apply auth middleware to each route individually)
router.get("/user/conversations", authenticateUser, userChatController.getUserConversations);
router.get("/user/conversations/:id", authenticateUser, userChatController.getConversation);
router.post("/user/conversations", authenticateUser, userChatController.createConversation);
router.post("/user/conversations/:id/messages", authenticateUser, userChatController.sendMessage);
router.delete("/user/conversations/:id", authenticateUser, userChatController.deleteConversation);
router.post("/user/conversations/link", authenticateUser, userChatController.linkConversation);

export default router;


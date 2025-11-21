import { Router } from "express";
import adminController from "../controllers/adminController";

const router = Router();

// All admin routes temporarily public for testing
// TODO: Add authMiddleware back after fixing issues

// User details and analysis
router.get(
  "/admin/user/:deviceId",
  adminController.getUserDetails.bind(adminController)
);

router.post(
  "/admin/ai/analyze/:deviceId",
  adminController.analyzeUser.bind(adminController)
);

router.post(
  "/admin/ai/query",
  adminController.queryUserData.bind(adminController)
);

// Admin statistics
router.get(
  "/admin/stats",
  adminController.getAdminStats.bind(adminController)
);

export default router;


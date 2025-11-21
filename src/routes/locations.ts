import { Router } from "express";
import locationController from "../controllers/locationController";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiter for adding locations (prevent abuse)
const addLocationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Max 10 requests per minute per IP
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// All endpoints temporarily public for testing
router.post("/locations", addLocationLimiter, locationController.addLocation.bind(locationController));
router.get("/locations", locationController.getAllLocations.bind(locationController));
router.get("/stats", locationController.getStats.bind(locationController));
router.delete("/locations", locationController.clearAllLocations.bind(locationController));

export default router;


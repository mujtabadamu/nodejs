import { Request, Response } from "express";
import locationModel from "../models/locationModel";
import Joi from "joi";
import { extractClientIP, cleanIPv6 } from "../utils/ipUtils";
import { getLocationFromIP, ipApiRateLimiter } from "../services/ipGeolocation";
import { generateDeviceFingerprint, isValidDeviceFingerprint } from "../utils/deviceFingerprint";

class LocationController {
  // Validation schema for adding location (optional body params)
  private addLocationSchema = Joi.object({
    deviceId: Joi.string().optional(), // Client-generated device fingerprint
    timestamp: Joi.number().optional(),
    userAgent: Joi.string().optional(),
  });

  // POST /api/locations - Add a new location (IP-based)
  async addLocation(req: Request, res: Response) {
    try {
      // Validate request body (now optional)
      const { error, value } = this.addLocationSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: error.details[0].message 
        });
      }

      // Generate device fingerprint
      const deviceId = generateDeviceFingerprint(req, value.deviceId);
      
      // Extract client IP from request (server-side, can't be spoofed)
      let clientIP = extractClientIP(req);
      clientIP = cleanIPv6(clientIP);
      
      console.log(`📍 Tracking device: ${deviceId.substring(0, 8)}... (IP: ${clientIP})`);

      // Check rate limit for IP-API
      if (!ipApiRateLimiter.canMakeRequest()) {
        const waitTime = ipApiRateLimiter.getWaitTime();
        return res.status(429).json({
          error: "Rate limit exceeded",
          message: `Too many requests. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
        });
      }

      // Get location data from IP address
      const ipLocation = await getLocationFromIP(clientIP);

      if (!ipLocation) {
        return res.status(500).json({
          error: "Failed to determine location",
          message: "Could not retrieve location from IP address",
        });
      }

      // Add or update location in database (upsert based on device_id)
      const location = await locationModel.addLocation({
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
        timestamp: value.timestamp || Date.now(),
        userAgent: value.userAgent || req.get("user-agent") || "Unknown",
      });

      const message = location.isNewDevice 
        ? `New device tracked from ${location.city}, ${location.country}`
        : `Device location updated (visit #${location.visitCount})`;

      res.status(200).json({
        success: true,
        location,
        message: ipLocation.isLocal 
          ? "Local/Private IP detected - location data may be inaccurate" 
          : message,
      });
    } catch (error: any) {
      console.error("Error adding location:", error);
      res.status(500).json({ 
        error: "Failed to add location",
        details: error.message 
      });
    }
  }

  // GET /api/locations - Get all locations
  async getAllLocations(req: Request, res: Response) {
    try {
      const locations = await locationModel.getAllLocations();
      
      res.status(200).json({
        success: true,
        locations,
        count: locations.length,
      });
    } catch (error: any) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ 
        error: "Failed to fetch locations",
        details: error.message 
      });
    }
  }

  // GET /api/stats - Get statistics
  async getStats(req: Request, res: Response) {
    try {
      const stats = await locationModel.getStats();
      
      res.status(200).json({
        success: true,
        ...stats,
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ 
        error: "Failed to fetch stats",
        details: error.message 
      });
    }
  }

  // DELETE /api/locations - Clear all locations (admin only)
  async clearAllLocations(req: Request, res: Response) {
    try {
      await locationModel.clearAllLocations();
      
      res.status(200).json({
        success: true,
        message: "All locations cleared",
      });
    } catch (error: any) {
      console.error("Error clearing locations:", error);
      res.status(500).json({ 
        error: "Failed to clear locations",
        details: error.message 
      });
    }
  }
}

export default new LocationController();


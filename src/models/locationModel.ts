import pool from "../config/db";

export interface Location {
  id?: number;
  deviceId: string;
  ipAddress: string;
  lat: number;
  lng: number;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  isp?: string;
  timezone?: string;
  isLocal: boolean;
  timestamp: number;
  userAgent?: string;
  firstSeen?: Date;
  lastSeen?: Date;
  visitCount?: number;
}

export interface LocationResponse {
  id: string;
  deviceId: string;
  ipAddress: string;
  lat: number;
  lng: number;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  isp: string;
  timezone: string;
  isLocal: boolean;
  timestamp: number;
  userAgent: string;
  firstSeen: string;
  lastSeen: string;
  visitCount: number;
  isNewDevice: boolean;
}

class LocationModel {
  // Add or update location (upsert based on device_id)
  async addLocation(location: Location): Promise<LocationResponse> {
    const {
      deviceId,
      ipAddress,
      lat,
      lng,
      city,
      region,
      country,
      countryCode,
      isp,
      timezone,
      isLocal,
      timestamp,
      userAgent,
    } = location;
    
    // Check if device exists
    const checkQuery = `SELECT id, visit_count FROM locations WHERE device_id = $1`;
    const existingDevice = await pool.query(checkQuery, [deviceId]);
    const isNewDevice = existingDevice.rows.length === 0;
    
    let result;
    
    if (isNewDevice) {
      // Insert new device
      const insertQuery = `
        INSERT INTO locations (
          device_id, ip_address, lat, lng, city, region, country, country_code,
          isp, timezone, is_local, timestamp, user_agent, 
          first_seen, last_seen, visit_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), 1)
        RETURNING *
      `;
      
      const values = [
        deviceId,
        ipAddress,
        lat,
        lng,
        city || "Unknown",
        region || "Unknown",
        country || "Unknown",
        countryCode || "XX",
        isp || "Unknown",
        timezone || "Unknown",
        isLocal,
        timestamp || Date.now(),
        userAgent || "Unknown",
      ];
      
      result = await pool.query(insertQuery, values);
    } else {
      // Update existing device (refresh location and update last_seen)
      // Only increment visit_count if last_seen was more than 5 minutes ago (new session)
      const updateQuery = `
        UPDATE locations 
        SET 
          ip_address = $2,
          lat = $3,
          lng = $4,
          city = $5,
          region = $6,
          country = $7,
          country_code = $8,
          isp = $9,
          timezone = $10,
          is_local = $11,
          timestamp = $12,
          user_agent = $13,
          last_seen = NOW(),
          visit_count = CASE 
            WHEN last_seen < NOW() - INTERVAL '5 minutes' 
            THEN visit_count + 1 
            ELSE visit_count 
          END
        WHERE device_id = $1
        RETURNING *
      `;
      
      const values = [
        deviceId,
        ipAddress,
        lat,
        lng,
        city || "Unknown",
        region || "Unknown",
        country || "Unknown",
        countryCode || "XX",
        isp || "Unknown",
        timezone || "Unknown",
        isLocal,
        timestamp || Date.now(),
        userAgent || "Unknown",
      ];
      
      result = await pool.query(updateQuery, values);
    }
    
    const row = result.rows[0];
    
    return {
      id: row.id.toString(),
      deviceId: row.device_id,
      ipAddress: row.ip_address,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      city: row.city,
      region: row.region,
      country: row.country,
      countryCode: row.country_code,
      isp: row.isp,
      timezone: row.timezone,
      isLocal: row.is_local,
      timestamp: parseInt(row.timestamp),
      userAgent: row.user_agent,
      firstSeen: row.first_seen.toISOString(),
      lastSeen: row.last_seen.toISOString(),
      visitCount: parseInt(row.visit_count),
      isNewDevice,
    };
  }

  // Get all locations
  async getAllLocations(): Promise<LocationResponse[]> {
    const query = `
      SELECT * FROM locations
      ORDER BY last_seen DESC
    `;
    
    const result = await pool.query(query);
    
    return result.rows.map(row => ({
      id: row.id.toString(),
      deviceId: row.device_id,
      ipAddress: row.ip_address,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      city: row.city,
      region: row.region,
      country: row.country,
      countryCode: row.country_code,
      isp: row.isp,
      timezone: row.timezone,
      isLocal: row.is_local,
      timestamp: parseInt(row.timestamp),
      userAgent: row.user_agent,
      firstSeen: row.first_seen.toISOString(),
      lastSeen: row.last_seen.toISOString(),
      visitCount: parseInt(row.visit_count),
      isNewDevice: false, // All existing records are not new
    }));
  }

  // Get statistics
  async getStats() {
    const countQuery = "SELECT COUNT(*) as total FROM locations";
    const countResult = await pool.query(countQuery);
    const totalLocations = parseInt(countResult.rows[0].total);

    const uniqueQuery = "SELECT COUNT(DISTINCT user_agent) as unique FROM locations";
    const uniqueResult = await pool.query(uniqueQuery);
    const uniqueDevices = parseInt(uniqueResult.rows[0].unique);

    const latestQuery = `
      SELECT * FROM locations
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    const latestResult = await pool.query(latestQuery);
    
    let latestLocation = null;
    if (latestResult.rows.length > 0) {
      const row = latestResult.rows[0];
      latestLocation = {
        id: row.id.toString(),
        deviceId: row.device_id,
        ipAddress: row.ip_address,
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        city: row.city,
        region: row.region,
        country: row.country,
        countryCode: row.country_code,
        isp: row.isp,
        timezone: row.timezone,
        isLocal: row.is_local,
        timestamp: parseInt(row.timestamp),
        userAgent: row.user_agent,
        firstSeen: row.first_seen.toISOString(),
        lastSeen: row.last_seen.toISOString(),
        visitCount: parseInt(row.visit_count),
        isNewDevice: false,
      };
    }

    return {
      totalLocations,
      uniqueDevices,
      latestLocation,
    };
  }

  // Clear all locations
  async clearAllLocations(): Promise<void> {
    const query = "DELETE FROM locations";
    await pool.query(query);
  }
}

export default new LocationModel();


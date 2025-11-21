import { isLocalIP } from "../utils/ipUtils";

export interface IPLocationData {
  ip: string;
  lat: number;
  lng: number;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  isp?: string;
  timezone?: string;
  isLocal: boolean;
}

/**
 * Get location data from IP address using ip-api.com (free tier)
 * Free tier: 45 requests per minute from the same IP
 * 
 * Alternative services:
 * - ipapi.co: 1,000/day free
 * - ipinfo.io: 50,000/month free
 * - MaxMind GeoLite2: Unlimited (self-hosted database)
 */
export async function getLocationFromIP(
  ip: string
): Promise<IPLocationData | null> {
  try {
    // Check if localhost or private IP
    if (isLocalIP(ip)) {
      console.log(`⚠️  Local/Private IP detected: ${ip}`);
      return {
        ip,
        lat: 0,
        lng: 0,
        city: "Local Network",
        region: "N/A",
        country: "Local",
        countryCode: "XX",
        isp: "Local Network",
        timezone: "N/A",
        isLocal: true,
      };
    }

    // Call ip-api.com
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,query`
    );

    if (!response.ok) {
      console.error(`IP-API error: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.status === "fail") {
      console.error(`IP-API failed: ${data.message}`);
      return null;
    }

    return {
      ip: data.query,
      lat: data.lat,
      lng: data.lon,
      city: data.city || "Unknown",
      region: data.regionName || "Unknown",
      country: data.country || "Unknown",
      countryCode: data.countryCode || "XX",
      isp: data.isp || "Unknown",
      timezone: data.timezone || "Unknown",
      isLocal: false,
    };
  } catch (error: any) {
    console.error("Error fetching IP geolocation:", error.message);
    return null;
  }
}

/**
 * Alternative: ipinfo.io (requires API token for production)
 * Free tier: 50,000 requests/month
 */
export async function getLocationFromIPInfo(
  ip: string,
  token?: string
): Promise<IPLocationData | null> {
  try {
    if (isLocalIP(ip)) {
      return null;
    }

    const url = token
      ? `https://ipinfo.io/${ip}?token=${token}`
      : `https://ipinfo.io/${ip}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const [lat, lng] = data.loc ? data.loc.split(",").map(Number) : [0, 0];

    return {
      ip: data.ip,
      lat,
      lng,
      city: data.city || "Unknown",
      region: data.region || "Unknown",
      country: data.country || "Unknown",
      countryCode: data.country || "XX",
      isp: data.org || "Unknown",
      timezone: data.timezone || "Unknown",
      isLocal: false,
    };
  } catch (error) {
    console.error("Error fetching from ipinfo.io:", error);
    return null;
  }
}

/**
 * Rate limiter for IP-API (45 requests/minute)
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 45;
  private readonly timeWindow = 60000; // 1 minute

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove requests older than time window
    this.requests = this.requests.filter((time) => now - time < this.timeWindow);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  getWaitTime(): number {
    if (this.requests.length === 0) return 0;
    const oldest = this.requests[0];
    const waitTime = this.timeWindow - (Date.now() - oldest);
    return Math.max(0, waitTime);
  }
}

export const ipApiRateLimiter = new RateLimiter();


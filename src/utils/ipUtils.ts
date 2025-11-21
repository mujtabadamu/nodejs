import { Request } from "express";

/**
 * Extract the real client IP address from the request
 * Handles proxies, load balancers, and Cloudflare
 */
export function extractClientIP(req: Request): string {
  // Check various headers in order of preference
  const forwarded = req.headers["x-forwarded-for"];
  const realIP = req.headers["x-real-ip"];
  const cfConnectingIP = req.headers["cf-connecting-ip"]; // Cloudflare
  
  // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2)
  // The first one is usually the real client IP
  if (forwarded) {
    const ips = (forwarded as string).split(",");
    return ips[0].trim();
  }
  
  // X-Real-IP is set by some proxies/load balancers
  if (realIP) {
    return realIP as string;
  }
  
  // Cloudflare sets this header
  if (cfConnectingIP) {
    return cfConnectingIP as string;
  }
  
  // Fallback to direct socket address
  return req.socket.remoteAddress || "unknown";
}

/**
 * Check if IP is localhost or private network
 */
export function isLocalIP(ip: string): boolean {
  if (!ip || ip === "unknown") return true;
  
  // Localhost patterns
  if (ip === "::1" || ip === "127.0.0.1" || ip.startsWith("localhost")) {
    return true;
  }
  
  // Private network ranges
  const privateRanges = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
    /^169\.254\./,              // 169.254.0.0/16 (link-local)
    /^fc00:/,                   // IPv6 private
    /^fe80:/,                   // IPv6 link-local
  ];
  
  return privateRanges.some(range => range.test(ip));
}

/**
 * Clean IPv6 addresses (remove IPv4 mapping prefix)
 */
export function cleanIPv6(ip: string): string {
  // Remove IPv4-mapped IPv6 prefix
  if (ip.startsWith("::ffff:")) {
    return ip.replace("::ffff:", "");
  }
  return ip;
}


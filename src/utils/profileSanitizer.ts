import { UserProfile } from "../models/userProfileModel";

/**
 * Sanitize user profile by removing sensitive/risk fields
 * Only admins should see risk assessment data
 */
export function sanitizeProfile(profile: UserProfile | null): Omit<UserProfile, 'riskLevel' | 'riskScore' | 'riskFlags' | 'lastRiskAnalysis'> | null {
  if (!profile) {
    return null;
  }

  const { riskLevel, riskScore, riskFlags, lastRiskAnalysis, ...sanitized } = profile;
  return sanitized;
}

/**
 * Check if request is from admin (has admin auth token)
 */
export function isAdminRequest(req: any): boolean {
  // Check if admin token exists in headers
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  // You can add more sophisticated admin check here
  // For now, we'll rely on route-level auth middleware
  return false;
}


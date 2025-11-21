import crypto from "crypto";
import { Request } from "express";

/**
 * Generate a unique device fingerprint based on multiple factors
 * This helps identify unique devices without cookies
 */
export function generateDeviceFingerprint(req: Request, clientFingerprint?: string): string {
  // If client provides their own fingerprint (browser-generated), use it
  if (clientFingerprint && clientFingerprint.length > 10) {
    return crypto.createHash('sha256').update(clientFingerprint).digest('hex');
  }

  // Otherwise, generate server-side fingerprint
  const factors = [
    req.get('user-agent') || 'unknown',
    req.get('accept-language') || 'unknown',
    req.get('accept-encoding') || 'unknown',
    // Note: IP is not included as it can change (mobile networks, VPN)
  ];

  const fingerprintString = factors.join('|');
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
}

/**
 * Validate device fingerprint format
 */
export function isValidDeviceFingerprint(fingerprint: string): boolean {
  // Should be a 64-character hex string (SHA-256)
  return /^[a-f0-9]{64}$/i.test(fingerprint);
}


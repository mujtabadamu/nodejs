import pool from "../config/db";

export interface AdminLogin {
  id?: number;
  adminId: number;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  timestamp?: Date;
}

class AdminLoginModel {
  // Log an admin login attempt
  async logLogin(login: AdminLogin): Promise<AdminLogin> {
    const query = `
      INSERT INTO admin_logins (admin_id, ip_address, user_agent, success, failure_reason, timestamp)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, admin_id, ip_address, user_agent, success, failure_reason, timestamp
    `;
    
    const values = [
      login.adminId,
      login.ipAddress,
      login.userAgent || null,
      login.success,
      login.failureReason || null,
    ];
    
    const result = await pool.query(query, values);
    const row = result.rows[0];
    
    return {
      id: row.id,
      adminId: row.admin_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      success: row.success,
      failureReason: row.failure_reason,
      timestamp: row.timestamp,
    };
  }
  
  // Get login history for an admin
  async getLoginHistory(adminId: number, limit: number = 50): Promise<AdminLogin[]> {
    const query = `
      SELECT id, admin_id, ip_address, user_agent, success, failure_reason, timestamp
      FROM admin_logins
      WHERE admin_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [adminId, limit]);
    
    return result.rows.map(row => ({
      id: row.id,
      adminId: row.admin_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      success: row.success,
      failureReason: row.failure_reason,
      timestamp: row.timestamp,
    }));
  }
  
  // Get all login attempts (for admin dashboard)
  async getAllLogins(limit: number = 100): Promise<AdminLogin[]> {
    const query = `
      SELECT 
        al.id, 
        al.admin_id, 
        al.ip_address, 
        al.user_agent, 
        al.success, 
        al.failure_reason, 
        al.timestamp,
        au.username,
        au.email
      FROM admin_logins al
      LEFT JOIN admin_users au ON al.admin_id = au.id
      ORDER BY al.timestamp DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    
    return result.rows.map(row => ({
      id: row.id,
      adminId: row.admin_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      success: row.success,
      failureReason: row.failure_reason,
      timestamp: row.timestamp,
      adminUsername: row.username,
      adminEmail: row.email,
    }));
  }
  
  // Get failed login attempts count for an IP (for security)
  async getFailedLoginCount(ipAddress: string, minutes: number = 15): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM admin_logins
      WHERE ip_address = $1 
        AND success = false
        AND timestamp > NOW() - INTERVAL '${minutes} minutes'
    `;
    
    const result = await pool.query(query, [ipAddress]);
    return parseInt(result.rows[0].count);
  }
}

export default new AdminLoginModel();


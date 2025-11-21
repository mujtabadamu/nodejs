import pool from "../config/db";
import bcrypt from "bcrypt";

export interface Admin {
  id?: number;
  username: string;
  email: string;
  password: string;
}

export interface AdminResponse {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
}

class AdminModel {
  private readonly SALT_ROUNDS = 10;

  // Create a new admin user
  async createAdmin(admin: Admin): Promise<AdminResponse> {
    const { username, email, password } = admin;
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);
    
    const query = `
      INSERT INTO admin_users (username, email, password_hash, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, username, email, created_at
    `;
    
    const values = [username, email, passwordHash];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find admin by email
  async findByEmail(email: string): Promise<any> {
    const query = "SELECT * FROM admin_users WHERE email = $1";
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Find admin by username
  async findByUsername(username: string): Promise<any> {
    const query = "SELECT * FROM admin_users WHERE username = $1";
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  // Verify password
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Check if any admin exists
  async adminExists(): Promise<boolean> {
    const query = "SELECT COUNT(*) as count FROM admin_users";
    const result = await pool.query(query);
    return parseInt(result.rows[0].count) > 0;
  }

  // Get all admins (without password hashes)
  async getAllAdmins(): Promise<AdminResponse[]> {
    const query = `
      SELECT id, username, email, created_at 
      FROM admin_users 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

export default new AdminModel();


import pool from "../config/db";

export interface UserProfile {
  id?: number;
  deviceId: string;
  name?: string;
  age?: number;
  gender?: string;
  location?: string;
  occupation?: string;
  interests?: string[];
  passions?: string[];
  goals?: string[];
  personalityTraits?: string[];
  email?: string;
  phone?: string;
  profileCompletion?: number;
  lastUpdated?: Date;
  createdAt?: Date;
}

class UserProfileModel {
  // Get or create user profile
  async getOrCreateProfile(deviceId: string): Promise<UserProfile> {
    // Try to get existing profile
    const checkQuery = `SELECT * FROM user_profiles WHERE device_id = $1`;
    const existing = await pool.query(checkQuery, [deviceId]);
    
    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      return {
        id: row.id,
        deviceId: row.device_id,
        name: row.name,
        age: row.age,
        gender: row.gender,
        location: row.location,
        occupation: row.occupation,
        interests: row.interests || [],
        passions: row.passions || [],
        goals: row.goals || [],
        personalityTraits: row.personality_traits || [],
        email: row.email,
        phone: row.phone,
        profileCompletion: row.profile_completion || 0,
        lastUpdated: row.last_updated,
        createdAt: row.created_at,
      };
    }
    
    // Create new profile
    const insertQuery = `
      INSERT INTO user_profiles (device_id, profile_completion)
      VALUES ($1, 0)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [deviceId]);
    const row = result.rows[0];
    
    return {
      id: row.id,
      deviceId: row.device_id,
      profileCompletion: 0,
      interests: [],
      passions: [],
      goals: [],
      personalityTraits: [],
    };
  }
  
  // Update user profile with extracted information
  async updateProfile(deviceId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const profile = await this.getOrCreateProfile(deviceId);
    
    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    
    if (updates.age) {
      fields.push(`age = $${paramCount++}`);
      values.push(updates.age);
    }
    
    if (updates.gender) {
      fields.push(`gender = $${paramCount++}`);
      values.push(updates.gender);
    }
    
    if (updates.location) {
      fields.push(`location = $${paramCount++}`);
      values.push(updates.location);
    }
    
    if (updates.occupation) {
      fields.push(`occupation = $${paramCount++}`);
      values.push(updates.occupation);
    }
    
    if (updates.interests && updates.interests.length > 0) {
      fields.push(`interests = array_cat(COALESCE(interests, ARRAY[]::text[]), $${paramCount++})`);
      values.push(updates.interests);
    }
    
    if (updates.passions && updates.passions.length > 0) {
      fields.push(`passions = array_cat(COALESCE(passions, ARRAY[]::text[]), $${paramCount++})`);
      values.push(updates.passions);
    }
    
    if (updates.goals && updates.goals.length > 0) {
      fields.push(`goals = array_cat(COALESCE(goals, ARRAY[]::text[]), $${paramCount++})`);
      values.push(updates.goals);
    }
    
    if (updates.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    
    if (updates.phone) {
      fields.push(`phone = $${paramCount++}`);
      values.push(updates.phone);
    }
    
    if (fields.length === 0) {
      return profile; // No updates
    }
    
    // Calculate profile completion
    const completionFields = ['name', 'age', 'occupation', 'location', 'interests'];
    const totalFields = completionFields.length;
    let completedFields = 0;
    
    if (profile.name || updates.name) completedFields++;
    if (profile.age || updates.age) completedFields++;
    if (profile.occupation || updates.occupation) completedFields++;
    if (profile.location || updates.location) completedFields++;
    if ((profile.interests && profile.interests.length > 0) || (updates.interests && updates.interests.length > 0)) completedFields++;
    
    const completion = Math.round((completedFields / totalFields) * 100);
    fields.push(`profile_completion = $${paramCount++}`);
    values.push(completion);
    
    fields.push(`last_updated = NOW()`);
    
    values.push(deviceId);
    
    const updateQuery = `
      UPDATE user_profiles
      SET ${fields.join(', ')}
      WHERE device_id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, values);
    const row = result.rows[0];
    
    return {
      id: row.id,
      deviceId: row.device_id,
      name: row.name,
      age: row.age,
      gender: row.gender,
      location: row.location,
      occupation: row.occupation,
      interests: row.interests || [],
      passions: row.passions || [],
      goals: row.goals || [],
      personalityTraits: row.personality_traits || [],
      email: row.email,
      phone: row.phone,
      profileCompletion: row.profile_completion,
      lastUpdated: row.last_updated,
      createdAt: row.created_at,
    };
  }
  
  // Get profile by device ID
  async getProfile(deviceId: string): Promise<UserProfile | null> {
    const query = `SELECT * FROM user_profiles WHERE device_id = $1`;
    const result = await pool.query(query, [deviceId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      deviceId: row.device_id,
      name: row.name,
      age: row.age,
      gender: row.gender,
      location: row.location,
      occupation: row.occupation,
      interests: row.interests || [],
      passions: row.passions || [],
      goals: row.goals || [],
      personalityTraits: row.personality_traits || [],
      email: row.email,
      phone: row.phone,
      profileCompletion: row.profile_completion,
      lastUpdated: row.last_updated,
      createdAt: row.created_at,
    };
  }
  
  // Get all profiles (admin view)
  async getAllProfiles(): Promise<UserProfile[]> {
    const query = `
      SELECT * FROM user_profiles
      ORDER BY profile_completion DESC, last_updated DESC
    `;
    
    const result = await pool.query(query);
    
    return result.rows.map(row => ({
      id: row.id,
      deviceId: row.device_id,
      name: row.name,
      age: row.age,
      gender: row.gender,
      location: row.location,
      occupation: row.occupation,
      interests: row.interests || [],
      passions: row.passions || [],
      goals: row.goals || [],
      personalityTraits: row.personality_traits || [],
      email: row.email,
      phone: row.phone,
      profileCompletion: row.profile_completion,
      lastUpdated: row.last_updated,
      createdAt: row.created_at,
    }));
  }
}

export default new UserProfileModel();


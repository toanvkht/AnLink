const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Generate JWT token
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || 'anlink_secret_key_change_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password, full_name, phone_number, location } = req.body;

    // Validation
    if (!email || !password || !full_name) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Email, password, and full name are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Invalid email format'
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Check if email already exists
    const existingUser = await query(
      'SELECT email FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        service: 'AnLink API',
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new user (role defaults to 'community_user')
    const result = await query(`
      INSERT INTO users (email, password_hash, full_name, phone_number, location, role)
      VALUES ($1, $2, $3, $4, $5, 'community_user')
      RETURNING user_id, email, full_name, role, status, created_at
    `, [email, password_hash, full_name, phone_number || null, location || null]);

    const newUser = result.rows[0];

    // Generate token
    const token = generateToken(newUser.user_id, newUser.email, newUser.role);

    // Log activity
    await query(`
      INSERT INTO user_activity_logs (user_id, action_type, action_details)
      VALUES ($1, 'register', $2)
    `, [newUser.user_id, JSON.stringify({ email, full_name })]);

    res.status(201).json({
      service: 'AnLink API',
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          user_id: newUser.user_id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          status: newUser.status,
          created_at: newUser.created_at
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ AnLink Registration error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Server error during registration'
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    console.log(' Login attempt for:', req.body.email);
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const result = await query(
      'SELECT user_id, email, password_hash, full_name, role, status FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        service: 'AnLink API',
        success: false,
        error: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Check if account is suspended
    if (user.status === 'suspended') {
      return res.status(403).json({
        service: 'AnLink API',
        success: false,
        error: 'Account is suspended. Please contact support.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        service: 'AnLink API',
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Update last_login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    // Log activity
    await query(`
      INSERT INTO user_activity_logs (user_id, action_type, action_details)
      VALUES ($1, 'login', $2)
    `, [user.user_id, JSON.stringify({ email })]);

    // Generate token
    const token = generateToken(user.user_id, user.email, user.role);

    res.json({
      service: 'AnLink API',
      success: true,
      message: 'Login successful',
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          status: user.status
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ AnLink Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Server error during login'
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const result = await query(`
      SELECT 
        user_id, email, full_name, role, status, 
        phone_number, location, language_preference, 
        created_at, last_login
      FROM users 
      WHERE user_id = $1
    `, [req.user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      service: 'AnLink API',
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ AnLink Get Profile error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Server error fetching profile'
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone_number, location, language_preference } = req.body;
    const userId = req.user.userId;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (full_name) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(full_name);
    }
    if (phone_number !== undefined) {
      updates.push(`phone_number = $${paramCount++}`);
      values.push(phone_number);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(location);
    }
    if (language_preference) {
      updates.push(`language_preference = $${paramCount++}`);
      values.push(language_preference);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'No fields to update'
      });
    }

    values.push(userId);

    const result = await query(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING user_id, email, full_name, phone_number, location, language_preference
    `, values);

    // Log activity
    await query(`
      INSERT INTO user_activity_logs (user_id, action_type, action_details)
      VALUES ($1, 'update_profile', $2)
    `, [userId, JSON.stringify(req.body)]);

    res.json({
      service: 'AnLink API',
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ AnLink Update Profile error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Server error updating profile'
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!current_password || !new_password) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    // Get current password hash
    const result = await query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, result.rows[0].password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        service: 'AnLink API',
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const new_password_hash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1 WHERE user_id = $2',
      [new_password_hash, userId]
    );

    // Log activity
    await query(`
      INSERT INTO user_activity_logs (user_id, action_type, action_details)
      VALUES ($1, 'change_password', $2)
    `, [userId, JSON.stringify({ timestamp: new Date() })]);

    res.json({
      service: 'AnLink API',
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ AnLink Change Password error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Server error changing password'
    });
  }
};

// Ensure all exports are defined
module.exports = {
  register: exports.register,
  login: exports.login,
  getProfile: exports.getProfile,
  updateProfile: exports.updateProfile,
  changePassword: exports.changePassword
};
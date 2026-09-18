const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { generateToken } = require('../utils/jwt');

/**
 * Register a new user
 * Fields ONLY: Full Name, Email, Password, Confirm Password, Role (INSPECTOR, MANAGER)
 * No phone number, no address, no DOB (Requirement 6)
 */
const register = async (req, res, next) => {
  try {
    const { full_name, email, password, confirmPassword, role } = req.body;

    if (!full_name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: Full Name, Email, Password, Confirm Password.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password do not match.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const assignedRole = (role && role.toUpperCase() === 'MANAGER') ? 'MANAGER' : 'INSPECTOR';

    // Check if email already exists
    const existingUsers = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.'
      });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Save user in MySQL
    const result = await query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [full_name.trim(), email.toLowerCase().trim(), password_hash, assignedRole]
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully. You can now log in.',
      userId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user with Email and Password
 * Returns JWT and user profile
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const users = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials.'
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials.'
      });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    };

    const token = generateToken(tokenPayload);

    return res.status(200).json({
      success: true,
      token,
      user: tokenPayload
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const users = await query('SELECT id, full_name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, user: users[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};

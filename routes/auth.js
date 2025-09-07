const express = require('express');
const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin, query } = require('../supabase');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Test database connection
router.get('/test-db', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as current_time');
    res.json({ 
      success: true, 
      currentTime: result.rows[0].current_time,
      message: 'Database connection successful!'
    });
  } catch (err) {
    console.error('Database connection test failed:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed',
      details: err.message 
    });
  }
});

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      name: user.name 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );
};

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
        code: 'missing_fields'
      });
    }
    
    console.log('Registration attempt for:', email);

    // Create user directly in the database using the admin client
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: { name: name }
    });

    if (error) {
      console.error('Admin create user error:', error);
      throw error;
    }

    // Return success response with user data
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.user.id,
        email: user.user.email,
        name: name
      }
    });
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
      stack: error.stack
    });
    
    const statusCode = error.status || 400;
    res.status(statusCode).json({ 
      error: error.message || 'Registration failed',
      code: error.code || 'registration_failed',
      details: error.details
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt for:', email);

  try {
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password']
      });
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Login error:', signInError);
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: signInError.message || 'Invalid email or password'
      });
    }

    // Get user data from public.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      throw userError;
    }

    // Generate JWT token
    const token = generateToken(userData);

    console.log('Login successful for user:', authData.user.id);
    res.json({ 
      success: true,
      token: token,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0]
      },
      message: 'Login successful'
    });
  } catch (err) {
    console.error('Login error:', {
      message: err.message,
      stack: err.stack
    });
    
    res.status(500).json({ 
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

// Get current user (protected route)
router.get('/me', async (req, res) => {
  try {
    // Get the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Get user data from public.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(userData);
  } catch (err) {
    console.error('Auth error:', {
      message: err.message,
      stack: err.stack
    });
    
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    res.status(500).json({ message: 'An error occurred while fetching user data' });
  }
});

module.exports = router;

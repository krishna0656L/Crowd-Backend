const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config();

// Initialize Supabase client for auth and storage
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Regular client for non-admin operations
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // We'll handle sessions manually
    detectSessionInUrl: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'quickdrop-backend/1.0.0'
    }
  }
});

// Admin client for admin operations
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Initialize direct PostgreSQL connection pool for database operations
const pool = new Pool({
  connectionString: 'postgresql://postgres:2BiVEkR5jtx52GHD@db.caupyiiqojwaioezkjsr.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false // For development only, use proper SSL in production
  }
});

// Test the database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();
  } catch (error) {
    console.error('❌ Error connecting to PostgreSQL database:', error.message);
    process.exit(1);
  }
}

// Test connection on startup
testConnection();

module.exports = {
  supabase,
  supabaseAdmin,
  pool,
  query: (text, params) => pool.query(text, params)
};

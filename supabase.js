const { createClient } = require('@supabase/supabase-js');
// Only load .env locally; in production Render injects env vars
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// In production, prefer to continue running even if Supabase envs are missing.
// Routes that depend on Supabase should handle this case gracefully.
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase env vars missing; supabase client will be a no-op in this environment');
}

const supabase = createClient(supabaseUrl || 'http://localhost', supabaseKey || 'anon', {
  auth: {
    persistSession: false, // We'll handle sessions manually
  },
});

module.exports = supabase;

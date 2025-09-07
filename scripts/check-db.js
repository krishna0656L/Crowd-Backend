const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or Service Role Key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if users table exists
    const { data: usersTable, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error accessing users table:', usersError.message);
    } else {
      console.log('✅ Users table exists');
      if (usersTable && usersTable.length > 0) {
        console.log('   Sample user:', JSON.stringify(usersTable[0], null, 2));
      } else {
        console.log('   No users found in the table');
      }
    }

    // Check if detection_history table exists
    const { data: historyTable, error: historyError } = await supabase
      .from('detection_history')
      .select('*')
      .limit(1);
    
    if (historyError) {
      console.error('❌ Error accessing detection_history table:', historyError.message);
    } else {
      console.log('✅ Detection history table exists');
      if (historyTable && historyTable.length > 0) {
        console.log('   Sample detection record:', JSON.stringify(historyTable[0], null, 2));
      } else {
        console.log('   No detection records found in the table');
      }
    }

    // Get table schema information
    console.log('\n📋 Database schema information:');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_info');
    
    if (tablesError) {
      console.log('Could not get detailed schema info, trying alternative method...');
      // Alternative method to get schema info
      const { data: schema, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_type')
        .eq('table_schema', 'public');
      
      if (schemaError) {
        console.error('Error getting schema info:', schemaError.message);
      } else if (schema && schema.length > 0) {
        console.log('\n📋 Database tables:');
        schema.forEach(table => {
          console.log(`- ${table.table_name} (${table.table_type})`);
        });
      } else {
        console.log('No tables found in the public schema');
      }
    } else {
      console.log(tables);
    }

  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase();

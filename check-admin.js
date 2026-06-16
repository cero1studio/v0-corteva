const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("No Supabase URL or Key found in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdmin() {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'admin');
  if (error) {
    console.error("Error fetching profiles:", error);
  } else {
    console.log("Admin profiles found:", data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

checkAdmin();

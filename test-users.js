require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function countUsers() {
  const { data, error } = await supabase.from('profiles').select('id', { count: 'exact' }).neq('role', 'admin');
  console.log('Total non-admin users:', data?.length, 'Count:', error ? error : 'Success');
}

countUsers();

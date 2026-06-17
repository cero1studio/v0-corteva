const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjstjaoltqbtqpehheph.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqc3RqYW9sdHFidHFwZWhoZXBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE0MDkxOCwiZXhwIjoyMDczNzE2OTE4fQ.z5V97GDCTcm1M24lGJtf_4dfZRFliYMGcDNMEgJhi-o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('profiles').select('id').limit(1);
  console.log('Result:', error ? error.message : 'Success: connected to the new project API!');
}

test();

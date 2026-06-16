const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/['"]/g, '');
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('profiles').select('id').limit(1);
  console.log('Read test:', error ? error.message : 'Success');
  
  const testId = '00000000-0000-0000-0000-000000000000';
  const { error: writeError } = await supabase.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', testId);
  console.log('Write test:', writeError ? writeError.message : 'Success');
}
check();

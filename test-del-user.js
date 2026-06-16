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
  const userId = 'cffd8b5b-acfc-4035-bed8-02b0ec8493d3';
  console.log('Deleting clients...');
  const { error: cErr } = await supabase.from('competitor_clients').delete().or(`user_id.eq.${userId},representative_id.eq.${userId}`);
  console.log('Clients del err:', cErr);
  
  console.log('Deleting profile...');
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  console.log('Profile del err:', error);
}
check();

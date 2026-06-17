const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/['"]/g, '');
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_ANON_KEY);

async function check() {
  console.log('Attempting login...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'javier@cerouno.digital',
    password: 'Sistemas2020##'
  });
  console.log('Login error:', error ? error.message : 'Success');
  if (data.user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
    console.log('Profile:', profile);
  }
}
check();

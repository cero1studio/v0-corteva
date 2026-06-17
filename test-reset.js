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
  console.log('Resetting password...');
  // Find user by email
  const { data: users, error: findError } = await supabase.auth.admin.listUsers();
  if (findError) return console.error('Find error:', findError);
  
  const user = users.users.find(u => u.email === 'javier@cerouno.digital');
  if (!user) return console.log('User not found!');
  
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password: 'Sistemas2020##'
  });
  console.log('Reset result:', error ? error.message : 'Success');
}
check();

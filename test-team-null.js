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
  const NIL_UUID = "00000000-0000-0000-0000-000000000000";
  console.log("Testing if team_id can be null...");
  let results = [];
  
  // Try to set team_id to null for a fake record or check column nullability
  const { data, error } = await supabase.rpc('get_schema_tables');
  if (error) {
    console.log("Fallback: attempting to update a non-existent row to team_id=null just to check constraint");
    for (let table of ['sales', 'penalties', 'penalty_history', 'free_kick_goals', 'competitor_clients']) {
      const { error: e } = await supabase.from(table).update({ team_id: null }).eq('id', NIL_UUID);
      console.log(table, e ? e.message : 'OK');
    }
  }
}
check();

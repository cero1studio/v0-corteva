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
  const NIL_UUID = "00000000-0000-0000-0000-000000000000"
  
  await supabase.from("teams").update({ captain_id: null }).neq("id", NIL_UUID)
  
  let { error: hErr } = await supabase.from("penalty_history").delete().neq("id", NIL_UUID); console.log("penalty_history", hErr);
  let { error: pErr } = await supabase.from("penalties").delete().neq("id", NIL_UUID); console.log("penalties", pErr);
  let { error: sErr } = await supabase.from("sales").delete().neq("id", NIL_UUID); console.log("sales", sErr);
  let { error: fErr } = await supabase.from("free_kick_goals").delete().neq("id", NIL_UUID); console.log("free_kick_goals", fErr);
  let { error: cErr } = await supabase.from("competitor_clients").delete().neq("id", NIL_UUID); console.log("competitor_clients", cErr);
  
  console.log("deleting profiles...");
  let { error: proErr } = await supabase.from("profiles").delete().neq("role", "admin");
  console.log("profiles", proErr);
}
check();

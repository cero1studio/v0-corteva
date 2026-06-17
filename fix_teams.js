const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({path: ".env.local"});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: teams } = await supabase.from("teams").select("id, name");
  const naviusId = teams.find(t => t.name.includes("Naviusfun"))?.id;
  const jueteId = teams.find(t => t.name.includes("El juete"))?.id;
  
  if (naviusId) {
    console.log("Fixing Naviusfun", naviusId);
    const { error } = await supabase.from("profiles")
      .update({ team_id: null })
      .eq("team_id", naviusId)
      .neq("email", "juan.carlos.caballero@llevolasriendas.com");
    if (error) console.error(error);
  }
  
  if (jueteId) {
    console.log("Fixing El juete", jueteId);
    const { error } = await supabase.from("profiles")
      .update({ team_id: null })
      .eq("team_id", jueteId);
    if (error) console.error(error);
  }
  
  console.log("Database fixed!");
}
run();

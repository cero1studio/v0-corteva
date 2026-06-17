import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from("profiles").select("email, role, vendedor_name, tecnico_name").eq("role", "capitan").order("created_at", { ascending: false }).limit(5);
  console.log("Latest Capitanes:");
  console.log(JSON.stringify(data, null, 2));
}
check();

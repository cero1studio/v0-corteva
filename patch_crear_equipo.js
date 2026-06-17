const fs = require("fs");
let code = fs.readFileSync("app/capitan/crear-equipo/page.tsx", "utf8");

// Fix the update query
code = code.replace(
  /\/\/ 2\. Actualizar el perfil del usuario Y todos los miembros de la misma zona y distribuidor[\s\S]*?\.eq\("distributor_id", profile\.distributor_id\)/,
  `// 2. Actualizar ÚNICAMENTE el perfil del capitán que creó el equipo
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          team_id: teamData.id,
        })
        .eq("id", profile.id)`
);

fs.writeFileSync("app/capitan/crear-equipo/page.tsx", code);
console.log("Patched crear-equipo logic");

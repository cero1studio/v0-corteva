const fs = require("fs");
let code = fs.readFileSync("app/cambiar-contrasena/page.tsx", "utf8");

// Change the logo URL to the local file
code = code.replace(
  `src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo_color-u60759kL9Lh56qN9EaM7NnsaZ9Hk4A.png"`,
  `src="/super-ganaderia-logo-transparent.png"`
);

fs.writeFileSync("app/cambiar-contrasena/page.tsx", code);
console.log("Patched logo");

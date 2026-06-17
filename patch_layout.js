const fs = require("fs");
let code = fs.readFileSync("app/layout.tsx", "utf8");

if (!code.includes("ImpersonationBanner")) {
  code = code.replace(
    'import { Toaster } from "@/components/ui/toaster"',
    `import { Toaster } from "@/components/ui/toaster"\nimport { ImpersonationBanner } from "@/components/impersonation-banner"`
  );

  code = code.replace(
    '<Toaster />\n        </SessionProvider>',
    `<Toaster />\n          <ImpersonationBanner />\n        </SessionProvider>`
  );
  fs.writeFileSync("app/layout.tsx", code);
  console.log("Patched layout");
}

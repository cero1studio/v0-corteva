const fs = require("fs");
let code = fs.readFileSync("types/next-auth.d.ts", "utf8");

code = code.replace(
  "force_password_change?: boolean\n    } & DefaultSession[\"user\"]",
  `force_password_change?: boolean
      original_admin_id?: string
      original_admin_role?: string
      original_admin_name?: string
    } & DefaultSession["user"]`
);

code = code.replace(
  "force_password_change?: boolean\n  }\n}\n\ndeclare module \"next-auth/jwt\"",
  `force_password_change?: boolean
    original_admin_id?: string
    original_admin_role?: string
    original_admin_name?: string
  }
}

declare module "next-auth/jwt"`
);

code = code.replace(
  "force_password_change?: boolean\n  }\n}",
  `force_password_change?: boolean
    original_admin_id?: string
    original_admin_role?: string
    original_admin_name?: string
  }
}`
);

fs.writeFileSync("types/next-auth.d.ts", code);
console.log("Patched types");

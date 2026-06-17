const fs = require("fs");
let code = fs.readFileSync("app/admin/usuarios/page.tsx", "utf8");

// Imports
if (!code.includes("useSession")) {
  code = code.replace(
    'import { useState, useEffect, useCallback } from "react"',
    `import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { getImpersonationData } from "@/app/actions/impersonate"`
  );
}

if (!code.includes("const { update } = useSession()")) {
  code = code.replace(
    '  const [searchTerm, setSearchTerm] = useState("")',
    `  const [searchTerm, setSearchTerm] = useState("")
  const { update } = useSession()
  const router = useRouter()
  const [isImpersonating, setIsImpersonating] = useState<string | null>(null)

  async function handleImpersonate(userId: string) {
    try {
      setIsImpersonating(userId)
      const res = await getImpersonationData(userId)
      if (!res.success || !res.data) {
        toast({ title: "Error", description: res.error, variant: "destructive" })
        return
      }
      
      // Update NextAuth session to trigger impersonation
      await update({
        isImpersonating: true,
        targetUser: res.data
      })
      
      toast({ title: "Modo Impersonación", description: \`Sesión iniciada como \${res.data.name}\` })
      
      // Redirect based on role
      if (res.data.role === "capitan") router.push("/capitan/dashboard")
      else if (res.data.role === "director_tecnico") router.push("/director-tecnico/dashboard")
      else if (res.data.role === "arbitro") router.push("/arbitro/dashboard")
      else router.push("/")
      
    } catch (e: any) {
      toast({ title: "Error", description: "Ocurrió un error inesperado", variant: "destructive" })
    } finally {
      setIsImpersonating(null)
    }
  }`
  );
}

if (!code.includes("handleImpersonate")) {
  console.log("Failed to inject handleImpersonate");
}

code = code.replace(
  '<Edit className="h-4 w-4" />',
  '<Edit className="h-4 w-4" />'
);

// We need to find the Buttons.
// Original:
// <Button variant="outline" size="icon" asChild>
//   <Link href={`/admin/usuarios/editar/${user.id}`}>
//     <Edit className="h-4 w-4" />
//     <span className="sr-only">Editar</span>
//   </Link>
// </Button>
// <Button

code = code.replace(
  '<div className="flex justify-end gap-2">',
  `<div className="flex justify-end gap-2">
    <Button 
      variant="outline" 
      size="icon" 
      title="Ingresar como..." 
      disabled={isImpersonating === user.id}
      onClick={() => handleImpersonate(user.id)}
    >
      <UserCheck className="h-4 w-4" />
      <span className="sr-only">Ingresar como</span>
    </Button>`
);

fs.writeFileSync("app/admin/usuarios/page.tsx", code);
console.log("Patched admin users page");

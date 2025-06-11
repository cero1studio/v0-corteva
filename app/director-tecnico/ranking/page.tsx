// ESTE console.log DEBE APARECER SI EL MÓDULO SE CARGA
console.log("--- app/director-tecnico/ranking/page.tsx MODULE LOADED (MINIMAL VERSION) ---")

import { AuthGuard } from "@/components/auth-guard" // Mantener AuthGuard ya que es esencial para la ruta

export default async function DirectorTecnicoRankingPage() {
  // ESTE console.log DEBE APARECER SI LA FUNCIÓN DEL COMPONENTE SE EJECUTA
  console.log("DirectorTecnicoRankingPage: INICIO de ejecución del Server Component (MINIMAL VERSION).")

  // Simplemente devuelve un mensaje para ver si algo se renderiza
  return (
    <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
      <div className="flex justify-center items-center h-full text-lg font-semibold">
        Cargando contenido del Ranking... (Versión Minimal)
      </div>
    </AuthGuard>
  )
}

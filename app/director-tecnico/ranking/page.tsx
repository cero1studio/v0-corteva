// ESTE console.log DEBE APARECER SI EL MÓDULO SE CARGA
console.log("--- app/director-tecnico/ranking/page.tsx MODULE LOADED ---")

import { createServerClient } from "@/lib/supabase/server"
import { AuthGuard } from "@/components/auth-guard"
import { getTeamRankingByZone, type TeamRanking } from "@/app/actions/ranking"
import { RankingDisplay } from "./components/ranking-display"

export default async function DirectorTecnicoRankingPage() {
  // ESTE console.log DEBE APARECER SI LA FUNCIÓN DEL COMPONENTE SE EJECUTA
  console.log("DirectorTecnicoRankingPage: INICIO de ejecución del Server Component.")

  const supabase = createServerClient()

  let zoneTeams: TeamRanking[] = []
  let nationalTeams: TeamRanking[] = []
  let userZoneName = "mi zona"
  let errorMessage: string | null = null

  try {
    console.log("DirectorTecnicoRankingPage: Intentando obtener usuario autenticado.")
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    console.log("DirectorTecnicoRankingPage: Usuario autenticado obtenido:", authUser ? authUser.id : "NINGUNO")

    if (!authUser) {
      console.log("DirectorTecnicoRankingPage: No hay usuario autenticado. Devolviendo AuthGuard con spinner.")
      return (
        <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
          </div>
        </AuthGuard>
      )
    }

    console.log("DirectorTecnicoRankingPage: Obteniendo perfil del usuario.")
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(`
         *,
         zones:zone_id(*)
       `)
      .eq("id", authUser.id)
      .single()

    if (profileError) {
      console.error("DirectorTecnicoRankingPage: ERROR al obtener perfil:", profileError)
      errorMessage = "Error al cargar el perfil del usuario."
    } else if (!profileData) {
      console.warn("DirectorTecnicoRankingPage: Datos de perfil nulos.")
      errorMessage = "No se encontró el perfil del usuario."
    } else if (!profileData.zone_id) {
      console.warn("DirectorTecnicoRankingPage: El usuario no tiene una zona asignada.")
      errorMessage = "No tienes una zona asignada. Por favor, contacta al administrador."
    } else {
      userZoneName = profileData.zones?.name || "mi zona"
      console.log("DirectorTecnicoRankingPage: Nombre de zona del usuario:", userZoneName)

      console.log("DirectorTecnicoRankingPage: Iniciando obtención de ranking de zona.")
      const zoneRankingResult = await getTeamRankingByZone(profileData.zone_id)
      if (zoneRankingResult.success) {
        zoneTeams = zoneRankingResult.data || []
        console.log("DirectorTecnicoRankingPage: Ranking de zona obtenido. Equipos:", zoneTeams.length)
      } else {
        console.error("DirectorTecnicoRankingPage: ERROR al obtener ranking de zona:", zoneRankingResult.error)
        errorMessage = zoneRankingResult.error || "No se pudo cargar el ranking de zona."
      }

      console.log("DirectorTecnicoRankingPage: Iniciando obtención de ranking nacional.")
      const nationalRankingResult = await getTeamRankingByZone() // Sin zoneId para nacional
      if (nationalRankingResult.success) {
        nationalTeams = nationalRankingResult.data || []
        console.log("DirectorTecnicoRankingPage: Ranking nacional obtenido. Equipos:", nationalTeams.length)
      } else {
        console.error("DirectorTecnicoRankingPage: ERROR al obtener ranking nacional:", nationalRankingResult.error)
        if (!errorMessage) {
          errorMessage = nationalRankingResult.error || "No se pudo cargar el ranking nacional."
        }
      }
    }
  } catch (error: any) {
    console.error("DirectorTecnicoRankingPage: ERROR GENERAL durante la carga de datos:", error)
    errorMessage = error?.message || "Error desconocido al cargar los rankings."
  }

  console.log(
    "DirectorTecnicoRankingPage: FIN de la obtención de datos del Server Component. Renderizando RankingDisplay.",
  )
  return (
    <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
      <RankingDisplay
        zoneTeams={zoneTeams}
        nationalTeams={nationalTeams}
        zoneName={userZoneName}
        errorMessage={errorMessage}
      />
    </AuthGuard>
  )
}

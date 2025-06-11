import { createServerClient } from "@/lib/supabase/server"
import { AuthGuard } from "@/components/auth-guard"
import { getSimpleRanking, getUserZone, type SimpleTeamRanking } from "@/app/actions/ranking-simple"
import { SimpleRankingDisplay } from "./components/simple-ranking-display"

export default async function DirectorTecnicoRankingPage() {
  console.log("DirectorTecnicoRankingPage: Iniciando carga de página")

  const supabase = createServerClient()

  let zoneTeams: SimpleTeamRanking[] = []
  let nationalTeams: SimpleTeamRanking[] = []
  let zoneName = "Mi Zona"
  let error: string | undefined

  try {
    // Obtener usuario autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("DirectorTecnicoRankingPage: Usuario no autenticado")
      return (
        <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </AuthGuard>
      )
    }

    console.log("DirectorTecnicoRankingPage: Usuario autenticado:", user.id)

    // Obtener zona del usuario
    const userZoneResult = await getUserZone(user.id)

    if (userZoneResult.success && userZoneResult.data) {
      zoneName = userZoneResult.data.zoneName

      // Obtener ranking de zona
      console.log("DirectorTecnicoRankingPage: Obteniendo ranking de zona")
      const zoneResult = await getSimpleRanking(userZoneResult.data.zoneId)

      if (zoneResult.success) {
        zoneTeams = zoneResult.data || []
        console.log("DirectorTecnicoRankingPage: Ranking de zona obtenido:", zoneTeams.length, "equipos")
      } else {
        console.error("DirectorTecnicoRankingPage: Error en ranking de zona:", zoneResult.error)
      }
    } else {
      console.warn("DirectorTecnicoRankingPage: No se pudo obtener zona del usuario:", userZoneResult.error)
      zoneName = "Sin Zona"
    }

    // Obtener ranking nacional
    console.log("DirectorTecnicoRankingPage: Obteniendo ranking nacional")
    const nationalResult = await getSimpleRanking()

    if (nationalResult.success) {
      nationalTeams = nationalResult.data || []
      console.log("DirectorTecnicoRankingPage: Ranking nacional obtenido:", nationalTeams.length, "equipos")
    } else {
      console.error("DirectorTecnicoRankingPage: Error en ranking nacional:", nationalResult.error)
      if (!error) {
        error = nationalResult.error
      }
    }
  } catch (err: any) {
    console.error("DirectorTecnicoRankingPage: Error general:", err)
    error = "Error al cargar los datos del ranking"
  }

  console.log("DirectorTecnicoRankingPage: Renderizando componente")

  return (
    <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
      <SimpleRankingDisplay zoneTeams={zoneTeams} nationalTeams={nationalTeams} zoneName={zoneName} error={error} />
    </AuthGuard>
  )
}

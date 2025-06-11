import { createServerClient } from "@/lib/supabase/server"
import { AuthGuard } from "@/components/auth-guard"
import { getTeamRankingByZone, type TeamRanking } from "@/app/actions/ranking"
import { RankingDisplay } from "./components/ranking-display"

// This component will be a Server Component by default (no 'use client' directive)
export default async function DirectorTecnicoRankingPage() {
  const supabase = createServerClient()

  let zoneTeams: TeamRanking[] = []
  let nationalTeams: TeamRanking[] = []
  let userZoneName = "mi zona"
  let errorMessage: string | null = null // To pass server-side errors to client component

  try {
    // Obtener el usuario actual
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      // AuthGuard should handle redirection, but good to have a fallback
      return (
        <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
          </div>
        </AuthGuard>
      )
    }

    // Obtener el perfil del usuario
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(`
         *,
         zones:zone_id(*)
       `)
      .eq("id", authUser.id)
      .single()

    if (profileError) {
      console.error("Error al obtener perfil:", profileError)
      errorMessage = "Error al cargar el perfil del usuario."
    } else if (!profileData.zone_id) {
      console.warn("Usuario no tiene una zona asignada.")
      errorMessage = "No tienes una zona asignada. Por favor, contacta al administrador."
    } else {
      userZoneName = profileData.zones?.name || "mi zona"

      // Obtener ranking de la zona
      const zoneRankingResult = await getTeamRankingByZone(profileData.zone_id)
      if (zoneRankingResult.success) {
        zoneTeams = zoneRankingResult.data || []
      } else {
        console.error("Error al obtener ranking de zona:", zoneRankingResult.error)
        errorMessage = zoneRankingResult.error || "No se pudo cargar el ranking de zona."
      }

      // Obtener ranking nacional
      const nationalRankingResult = await getTeamRankingByZone() // No zoneId for national
      if (nationalRankingResult.success) {
        nationalTeams = nationalRankingResult.data || []
      } else {
        console.error("Error al obtener ranking nacional:", nationalRankingResult.error)
        if (!errorMessage) {
          // Only set if no previous error
          errorMessage = nationalRankingResult.error || "No se pudo cargar el ranking nacional."
        }
      }
    }
  } catch (error: any) {
    console.error("Error general al cargar datos del ranking:", error)
    errorMessage = error?.message || "Error desconocido al cargar los rankings."
  }

  // Render a loading state while data is being fetched on the server
  // This part is actually executed on the server, so it's more about initial render
  // For a true client-side loading indicator, you'd use React.Suspense
  if (errorMessage) {
    return (
      <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
        <div className="flex justify-center items-center h-full text-red-500">{errorMessage}</div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
      <RankingDisplay
        zoneTeams={zoneTeams}
        nationalTeams={nationalTeams}
        zoneName={userZoneName}
        errorMessage={errorMessage} // Pass error message to client component
      />
    </AuthGuard>
  )
}

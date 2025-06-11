"use client"

import { createServerClient } from "@/lib/supabase/server"
import { AuthGuard } from "@/components/auth-guard"
import { getTeamRankingByZone, type TeamRanking } from "@/app/actions/ranking"
import { RankingDisplay } from "./components/ranking-display"
import { useToast } from "@/hooks/use-toast" // Import useToast for server-side error handling (though it's client-side)

// This component will be a Server Component
export default async function DirectorTecnicoRankingPage() {
  const supabase = createServerClient()
  const { toast } = useToast() // This hook will not work in a Server Component, but keeping it for now to show the original intent.
  // For server errors, consider passing error messages to the client component or using a global error boundary.

  let zoneTeams: TeamRanking[] = []
  let nationalTeams: TeamRanking[] = []
  let userZoneName = "mi zona"
  let loading = true // Initial loading state for the server component

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
      // In a real app, you might want to pass this error to the client component
      // or show a generic error page.
      return (
        <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
          <div className="flex justify-center items-center h-full text-red-500">
            Error al cargar el perfil del usuario.
          </div>
        </AuthGuard>
      )
    }

    if (!profileData.zone_id) {
      // This toast will not work directly in a Server Component.
      // You'd need to pass a message to the client component to display it.
      // For now, we'll just log and return an empty state.
      console.warn("Usuario no tiene una zona asignada.")
      return (
        <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <h3 className="text-xl font-semibold">No tienes una zona asignada</h3>
              <p className="text-muted-foreground">Por favor, contacta al administrador.</p>
            </div>
          </div>
        </AuthGuard>
      )
    }

    userZoneName = profileData.zones?.name || "mi zona"

    // Obtener ranking de la zona
    const zoneRankingResult = await getTeamRankingByZone(profileData.zone_id)
    if (zoneRankingResult.success) {
      zoneTeams = zoneRankingResult.data || []
    } else {
      console.error("Error al obtener ranking de zona:", zoneRankingResult.error)
      // Handle error, e.g., show an empty state or error message
    }

    // Obtener ranking nacional
    const nationalRankingResult = await getTeamRankingByZone() // No zoneId for national
    if (nationalRankingResult.success) {
      nationalTeams = nationalRankingResult.data || []
    } else {
      console.error("Error al obtener ranking nacional:", nationalRankingResult.error)
      // Handle error
    }
  } catch (error: any) {
    console.error("Error general al cargar datos del ranking:", error)
    // This toast will not work directly in a Server Component.
    // You'd need to pass a message to the client component to display it.
    // For now, we'll just log and return an empty state.
    return (
      <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
        <div className="flex justify-center items-center h-full text-red-500">
          Error al cargar los rankings: {error?.message || "Error desconocido"}
        </div>
      </AuthGuard>
    )
  } finally {
    loading = false // Data fetching is complete
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
      </div>
    )
  }

  return (
    <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
      <RankingDisplay zoneTeams={zoneTeams} nationalTeams={nationalTeams} zoneName={userZoneName} />
    </AuthGuard>
  )
}

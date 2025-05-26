import { createServerSupabaseClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export async function PenaltyTeamList() {
  const supabase = createServerSupabaseClient()

  // Obtener equipos con penaltis
  const { data: penaltyTeams, error } = await supabase
    .from("penalties")
    .select(`
      team_id,
      quantity,
      used,
      teams (
        id,
        name,
        logo_url
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error al cargar equipos con penaltis:", error)
    return <div>Error al cargar los datos</div>
  }

  // Agrupar por equipo y calcular totales
  const teamMap = new Map()

  penaltyTeams?.forEach((item) => {
    const teamId = item.team_id
    const team = item.teams

    if (!teamMap.has(teamId)) {
      teamMap.set(teamId, {
        id: teamId,
        name: team?.name || "Equipo desconocido",
        logo_url: team?.logo_url,
        total: 0,
        used: 0,
      })
    }

    const teamData = teamMap.get(teamId)
    teamData.total += item.quantity
    teamData.used += item.used
  })

  const teams = Array.from(teamMap.values())

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No hay equipos con penaltis asignados.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {teams.map((team) => {
        const available = team.total - team.used

        return (
          <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              {team.logo_url ? (
                <img
                  src={team.logo_url || "/placeholder.svg"}
                  alt={team.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {team.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-medium">{team.name}</h3>
                <div className="flex space-x-2 text-sm text-muted-foreground">
                  <span>Total: {team.total}</span>
                  <span>•</span>
                  <span>Usados: {team.used}</span>
                  <span>•</span>
                  <span>Disponibles: {available}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant={available > 0 ? "default" : "outline"}>{available} disponibles</Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/penalties/${team.id}`}>Ver detalles</Link>
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, TrendingUp } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/empty-state"
import { AuthGuard } from "@/components/auth-guard"
import { TeamLevelBadge } from "@/components/team-level-badge"

interface TeamRanking {
  id: string
  name: string
  total_points: number
  goals: number
  distributor_name: string
  zone_name: string
}

function DirectorTecnicoRankingContent() {
  const [loading, setLoading] = useState(true)
  const [zoneTeams, setZoneTeams] = useState<TeamRanking[]>([])
  const [nationalTeams, setNationalTeams] = useState<TeamRanking[]>([])
  const [userData, setUserData] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function calculateTeamPoints(teamId: string, memberIds: string[]) {
    // 1. CALCULAR PUNTOS DE VENTAS
    let totalSalesPoints = 0

    // Buscar ventas por representative_id (miembros del equipo)
    if (memberIds.length > 0) {
      const { data: salesByRep } = await supabase.from("sales").select("points").in("representative_id", memberIds)

      if (salesByRep) {
        totalSalesPoints += salesByRep.reduce((sum, sale) => sum + (sale.points || 0), 0)
      }
    }

    // Buscar ventas directas por team_id
    const { data: salesByTeam } = await supabase.from("sales").select("points").eq("team_id", teamId)

    if (salesByTeam) {
      totalSalesPoints += salesByTeam.reduce((sum, sale) => sum + (sale.points || 0), 0)
    }

    // 2. CALCULAR PUNTOS DE CLIENTES (evitar duplicados)
    let totalClientsPoints = 0
    const countedClientIds = new Set()

    if (memberIds.length > 0) {
      const { data: clientsByRep } = await supabase
        .from("competitor_clients")
        .select("id, points")
        .in("representative_id", memberIds)

      if (clientsByRep) {
        for (const client of clientsByRep) {
          if (!countedClientIds.has(client.id)) {
            totalClientsPoints += client.points || 200
            countedClientIds.add(client.id)
          }
        }
      }
    }

    // Clientes directos por team_id
    const { data: clientsByTeam } = await supabase.from("competitor_clients").select("id, points").eq("team_id", teamId)

    if (clientsByTeam) {
      for (const client of clientsByTeam) {
        if (!countedClientIds.has(client.id)) {
          totalClientsPoints += client.points || 200
          countedClientIds.add(client.id)
        }
      }
    }

    // 3. CALCULAR PUNTOS DE TIROS LIBRES
    const { data: freeKicks } = await supabase.from("free_kick_goals").select("points").eq("team_id", teamId)

    let totalFreeKickPoints = 0
    if (freeKicks) {
      totalFreeKickPoints = freeKicks.reduce((sum, freeKick) => sum + (freeKick.points || 0), 0)
    }

    return totalSalesPoints + totalClientsPoints + totalFreeKickPoints
  }

  async function loadData() {
    try {
      setLoading(true)

      // Obtener el usuario actual
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) return

      // Obtener el perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
         *,
         zones:zone_id(*)
       `)
        .eq("id", authUser.id)
        .single()

      if (profileError) throw profileError
      setUserData(profileData)

      // Obtener configuración de puntos para gol
      const { data: puntosConfig } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "puntos_para_gol")
        .maybeSingle()

      const puntosParaGol = puntosConfig?.value ? Number(puntosConfig.value) : 100

      if (!profileData.zone_id) {
        toast({
          title: "Error",
          description: "No tienes una zona asignada",
          variant: "destructive",
        })
        return
      }

      // Obtener equipos de la zona
      const { data: zoneTeamsData, error: zoneTeamsError } = await supabase
        .from("teams")
        .select(`
          id, 
          name,
          distributors(name),
          zones(name)
        `)
        .eq("zone_id", profileData.zone_id)

      if (zoneTeamsError) {
        console.error("Error al obtener equipos de zona:", zoneTeamsError)
      } else {
        // Calcular puntos reales para cada equipo de la zona
        const zoneRanking: TeamRanking[] = []

        for (const team of zoneTeamsData || []) {
          // Obtener miembros del equipo
          const { data: teamMembers } = await supabase.from("profiles").select("id").eq("team_id", team.id)

          const memberIds = teamMembers?.map((member) => member.id) || []
          const totalPoints = await calculateTeamPoints(team.id, memberIds)
          const goals = Math.floor(totalPoints / puntosParaGol)

          zoneRanking.push({
            id: team.id,
            name: team.name,
            total_points: totalPoints,
            goals: goals,
            distributor_name: team.distributors?.name || "Sin distribuidor",
            zone_name: team.zones?.name || "Sin zona",
          })
        }

        // Ordenar por puntos totales
        const sortedZoneRanking = zoneRanking.sort((a, b) => b.total_points - a.total_points)
        setZoneTeams(sortedZoneRanking)
        console.log("Equipos de zona cargados:", sortedZoneRanking.length)
      }

      // Obtener ranking nacional (todos los equipos)
      const { data: nationalTeamsData, error: nationalTeamsError } = await supabase.from("teams").select(`
          id, 
          name,
          zone_id,
          distributors(name),
          zones(name)
        `)

      if (nationalTeamsError) {
        console.error("Error al obtener equipos nacionales:", nationalTeamsError)
      } else {
        // Calcular puntos reales para cada equipo nacional
        const nationalRanking: TeamRanking[] = []

        for (const team of nationalTeamsData || []) {
          // Obtener miembros del equipo
          const { data: teamMembers } = await supabase.from("profiles").select("id").eq("team_id", team.id)

          const memberIds = teamMembers?.map((member) => member.id) || []
          const totalPoints = await calculateTeamPoints(team.id, memberIds)
          const goals = Math.floor(totalPoints / puntosParaGol)

          nationalRanking.push({
            id: team.id,
            name: team.name,
            total_points: totalPoints,
            goals: goals,
            distributor_name: team.distributors?.name || "Sin distribuidor",
            zone_name: team.zones?.name || "Sin zona",
          })
        }

        // Ordenar por puntos totales
        const sortedNationalRanking = nationalRanking.sort((a, b) => b.total_points - a.total_points)
        setNationalTeams(sortedNationalRanking)
        console.log("Equipos nacionales cargados:", sortedNationalRanking.length)
      }
    } catch (error: any) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudieron cargar los rankings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Rankings</h2>
        <p className="text-muted-foreground">Clasificación de equipos por puntos</p>
      </div>

      <Tabs defaultValue="zona" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zona">Ranking de Zona</TabsTrigger>
          <TabsTrigger value="nacional">Ranking Nacional</TabsTrigger>
        </TabsList>

        <TabsContent value="zona" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Ranking de {userData?.zones?.name || "mi zona"}
              </CardTitle>
              <CardDescription>Posiciones de los equipos en tu zona</CardDescription>
            </CardHeader>
            <CardContent>
              {zoneTeams && zoneTeams.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posición
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Equipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Distribuidor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Goles
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puntos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nivel
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {zoneTeams.map((team, index) => (
                        <tr key={team.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 font-bold">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.distributor_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                            {team.goals}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                            {team.total_points}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <TeamLevelBadge position={index + 1} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon="trophy"
                  title="No hay equipos en esta zona"
                  description="Cuando se creen equipos en esta zona, aparecerán en el ranking"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nacional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Ranking Nacional
              </CardTitle>
              <CardDescription>Los mejores equipos a nivel nacional</CardDescription>
            </CardHeader>
            <CardContent>
              {nationalTeams && nationalTeams.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posición
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Equipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Zona
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Distribuidor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Goles
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puntos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nivel
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {nationalTeams.map((team, index) => (
                        <tr key={team.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 font-bold">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.zone_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.distributor_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                            {team.goals}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                            {team.total_points}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <TeamLevelBadge position={index + 1} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon="trophy"
                  title="No hay equipos registrados"
                  description="Cuando se registren equipos, aparecerán en el ranking nacional"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function DirectorTecnicoRanking() {
  return (
    <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
      <DirectorTecnicoRankingContent />
    </AuthGuard>
  )
}

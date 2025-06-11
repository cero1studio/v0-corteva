"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/empty-state"
import { TeamLevelBadge } from "@/components/team-level-badge"
import type { TeamRanking } from "@/app/actions/ranking" // Import the type

interface RankingDisplayProps {
  zoneTeams: TeamRanking[]
  nationalTeams: TeamRanking[]
  zoneName: string
  errorMessage: string | null // New prop for server-side errors
}

export function RankingDisplay({ zoneTeams, nationalTeams, zoneName, errorMessage }: RankingDisplayProps) {
  const { toast } = useToast()

  useEffect(() => {
    if (errorMessage) {
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [errorMessage, toast])

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
                Ranking de {zoneName}
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

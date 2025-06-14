"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Download, Trophy, Medal, Database } from "lucide-react"
import { AdminRankingChart } from "@/components/admin-ranking-chart"
import { getTeamRankingByZone } from "@/app/actions/ranking"
import { EmptyState } from "@/components/empty-state"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import * as XLSX from "xlsx"
import { toast } from "@/components/ui/use-toast"

// Tipos para los datos
type Team = {
  team_id: string
  team_name: string
  zone_id: string
  zone_name: string
  goals: number
  position?: number
  total_points: number
  captain_name?: string
}

type Zone = {
  id: string
  name: string
  total_goals: number
  total_points: number
  teams_count: number
}

export default function RankingAdminPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [zoneFilter, setZoneFilter] = useState("all")
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsInZone, setTeamsInZone] = useState<Team[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [distributors, setDistributors] = useState<any[]>([])
  const [distributorFilter, setDistributorFilter] = useState("all")
  const [winningZone, setWinningZone] = useState<Zone | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  const supabase = createClientComponentClient()

  // Cargar datos iniciales
  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    // Timeout de seguridad para evitar loading infinito
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.log("ADMIN RANKING: Timeout reached, forcing loading to false")
        setIsLoading(false)
      }
    }, 15000) // 15 segundos para consultas complejas

    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        // Cargar zonas
        const { data: zonesData, error: zonesError } = await supabase.from("zones").select("*")

        if (zonesError) throw new Error(`Error al cargar zonas: ${zonesError.message}`)

        // Cargar distribuidores
        const { data: distributorsData, error: distributorsError } = await supabase.from("distributors").select("*")

        if (distributorsError) throw new Error(`Error al cargar distribuidores: ${distributorsError.message}`)

        // Usar la función para obtener el ranking nacional
        const rankingResult = await getTeamRankingByZone()

        if (!rankingResult.success) {
          throw new Error(rankingResult.error || "Error al cargar ranking")
        }

        const teamsData = rankingResult.data || []

        console.log("DEBUG: Teams data for ranking page:", teamsData)

        // Inicializar zonas con contadores en cero
        const zoneMap = new Map<string, Zone>()

        zonesData.forEach((zone) => {
          zoneMap.set(zone.id, {
            id: zone.id,
            name: zone.name,
            total_goals: 0,
            total_points: 0,
            teams_count: 0,
          })
        })

        // Calcular goles totales por zona
        teamsData.forEach((team) => {
          const zoneId = team.zone_id
          if (zoneMap.has(zoneId)) {
            const zone = zoneMap.get(zoneId)!
            zone.total_goals += team.goals
            zone.total_points += team.total_points
            zone.teams_count += 1
            zoneMap.set(zoneId, zone)
          }
        })

        const processedZones = Array.from(zoneMap.values())

        // Debug info
        let debug = "Zonas procesadas:\n"
        processedZones.forEach((zone) => {
          debug += `${zone.name}: ${zone.total_goals} goles, ${zone.teams_count} equipos, ${zone.total_points} puntos\n`
        })

        if (mounted) {
          setDebugInfo(debug)
        }

        console.log("DEBUG: Processed zones for ranking page (after aggregation):", processedZones)

        // Encontrar zona ganadora - ordenar por goles totales
        const sortedZones = [...processedZones].sort((a, b) => {
          // Primero por goles
          if (b.total_goals !== a.total_goals) return b.total_goals - a.total_goals
          // Si hay empate en goles, por puntos
          return b.total_points - a.total_points
        })

        console.log("DEBUG: Sorted zones for winning zone:", sortedZones)

        // Seleccionar la zona con más goles (si hay empate, la que tenga más puntos)
        const winner = sortedZones.length > 0 ? sortedZones[0] : null
        console.log("DEBUG: Winning zone selected:", winner)

        if (mounted) {
          setTeams(teamsData)
          setZones(processedZones)
          setDistributors(distributorsData)
          setWinningZone(winner)

          // Establecer zona seleccionada por defecto si hay zonas
          if (processedZones.length > 0 && !selectedZone) {
            setSelectedZone(processedZones[0].id)
          }
        }
      } catch (error: any) {
        console.error("Error cargando datos:", error)
        if (mounted) {
          setError(error.message)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [supabase])

  // Cargar equipos de zona específica cuando cambia selectedZone
  useEffect(() => {
    let mounted = true

    async function loadZoneTeams() {
      if (!selectedZone) return

      try {
        const rankingResult = await getTeamRankingByZone(selectedZone)
        if (rankingResult.success && rankingResult.data && mounted) {
          setTeamsInZone(rankingResult.data)
          console.log("DEBUG: Teams in selected zone:", rankingResult.data)
        }
      } catch (error) {
        console.error("Error cargando equipos de zona:", error)
      }
    }

    loadZoneTeams()

    return () => {
      mounted = false
    }
  }, [selectedZone])

  // Filtrar equipos
  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.team_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesZone = zoneFilter === "all" || team.zone_id === zoneFilter
    const matchesDistributor = true // Implementar cuando tengamos la relación equipo-distribuidor

    return matchesSearch && matchesZone && matchesDistributor
  })

  // Renderizar estado vacío
  const renderEmptyState = () => (
    <EmptyState
      icon={Trophy}
      title="No hay equipos en el ranking"
      description="No hay equipos registrados o no tienen ventas registradas."
      actionLabel="Crear equipo"
      actionHref="/admin/equipos/nuevo"
      iconClassName="bg-amber-100"
    />
  )

  // Renderizar estado de error
  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="rounded-full bg-red-100 p-3 text-red-600 mb-4">
        <Database className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-medium">Error al cargar datos</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">{error}</p>
      <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
        Intentar nuevamente
      </Button>
    </div>
  )

  const exportToExcel = () => {
    try {
      if (filteredTeams.length === 0) {
        toast({
          title: "Error",
          description: "No hay datos para exportar",
          variant: "destructive",
        })
        return
      }

      // Preparar datos para Excel (solo datos filtrados)
      const excelData = filteredTeams.map((team, index) => ({
        Posición: index + 1,
        Equipo: team.team_name,
        Capitán: team.captain_name || "Sin capitán",
        Zona: team.zone_name,
        Goles: team.goals,
        "Puntos Totales": team.total_points,
        Kilos: Math.round((team.total_points * 10) / 100), // Cálculo: puntos * 10 / 100
      }))

      // Crear workbook y worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Configurar anchos de columna
      const colWidths = [
        { wch: 10 }, // Posición
        { wch: 30 }, // Equipo
        { wch: 25 }, // Capitán
        { wch: 20 }, // Zona
        { wch: 10 }, // Goles
        { wch: 15 }, // Puntos Totales
        { wch: 10 }, // Kilos
      ]
      ws["!cols"] = colWidths

      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, "Ranking Nacional")

      // Si hay zona ganadora, agregar hoja adicional
      if (winningZone) {
        const zoneData = [
          {
            "Zona Ganadora": winningZone.name,
            "Goles Totales": winningZone.total_goals,
            Equipos: winningZone.teams_count,
            "Puntos Totales": winningZone.total_points,
            "Kilos Totales": Math.round((winningZone.total_points * 10) / 100),
          },
        ]
        const wsZone = XLSX.utils.json_to_sheet(zoneData)
        XLSX.utils.book_append_sheet(wb, wsZone, "Zona Ganadora")
      }

      // Generar archivo en formato binario
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })

      // Convertir a Blob
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      // Crear URL para el blob
      const url = URL.createObjectURL(blob)

      // Crear elemento de enlace para descargar
      const a = document.createElement("a")
      a.href = url
      a.download = `ranking_nacional_${new Date().toISOString().split("T")[0]}.xlsx`

      // Simular clic para iniciar descarga
      document.body.appendChild(a)
      a.click()

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)

      toast({
        title: "Éxito",
        description: "Ranking exportado correctamente",
      })
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast({
        title: "Error",
        description: "Error al exportar el ranking",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ranking del Concurso</h2>
          <p className="text-muted-foreground">Visualiza y gestiona el ranking de equipos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={exportToExcel} disabled={filteredTeams.length === 0}>
            <Download className="h-4 w-4" />
            Exportar Ranking
          </Button>
        </div>
      </div>

      <Tabs defaultValue="nacional" className="space-y-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <TabsList className="h-10">
            <TabsTrigger value="nacional" className="text-sm">
              Ranking Nacional
            </TabsTrigger>
            <TabsTrigger value="zona" className="text-sm">
              Ranking por Zona
            </TabsTrigger>
            <TabsTrigger value="grafico" className="text-sm">
              Gráfico Comparativo
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar equipo..."
                className="w-[200px] pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Zona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las zonas</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={distributorFilter} onValueChange={setDistributorFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Distribuidor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los distribuidores</SelectItem>
                {distributors.map((distributor) => (
                  <SelectItem key={distributor.id} value={distributor.id}>
                    <div className="flex items-center gap-2">
                      <span>{distributor.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSearchTerm("")
                setZoneFilter("all")
                setDistributorFilter("all")
              }}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="nacional" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Ranking Nacional
              </CardTitle>
              <CardDescription>Clasificación general de todos los equipos</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-600"></div>
                </div>
              ) : error ? (
                renderErrorState()
              ) : teams.length === 0 ? (
                renderEmptyState()
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Pos.</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Capitán</TableHead>
                      <TableHead>Zona</TableHead>
                      <TableHead className="text-right">Goles</TableHead>
                      <TableHead className="text-right">Kilos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.map((team) => (
                      <TableRow key={team.team_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {team.position}
                            {team.position === 1 && <span className="text-lg">🥇</span>}
                            {team.position === 2 && <span className="text-lg">🥈</span>}
                            {team.position === 3 && <span className="text-lg">🥉</span>}
                          </div>
                        </TableCell>
                        <TableCell>{team.team_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{team.captain_name}</TableCell>
                        <TableCell>{team.zone_name}</TableCell>
                        <TableCell className="text-right font-bold text-corteva-600">{team.goals}</TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {Math.round((team.total_points * 10) / 100)} kg
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {winningZone && teams.length > 0 && !error && (
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="col-span-1 md:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Medal className="h-5 w-5 text-yellow-500" />
                    Zona Ganadora
                  </CardTitle>
                  <CardDescription>La zona con mayor puntaje acumulado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-8 py-4">
                    <div className="text-center">
                      <div className="mx-auto h-20 w-20 rounded-full border-4 border-yellow-400 flex items-center justify-center bg-gray-100">
                        <Trophy className="h-10 w-10 text-yellow-500" />
                      </div>
                      <h3 className="mt-2 text-xl font-bold">{winningZone.name}</h3>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-corteva-600">{winningZone.total_goals}</div>
                      <p className="text-sm text-muted-foreground">Goles totales</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold">{winningZone.teams_count}</div>
                      <p className="text-sm text-muted-foreground">Equipos</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600">
                        {Math.round((winningZone.total_points * 10) / 100)}
                      </div>
                      <p className="text-sm text-muted-foreground">Kilos totales</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="zona" className="space-y-6">
          <div className="mb-4">
            <Select
              value={selectedZone || ""}
              onValueChange={(value) => setSelectedZone(value)}
              disabled={zones.length === 0 || isLoading || !!error}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Seleccionar zona" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Ranking Zona {zones.find((z) => z.id === selectedZone)?.name || ""}
              </CardTitle>
              <CardDescription>Clasificación de equipos en la zona seleccionada</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-600"></div>
                </div>
              ) : error ? (
                renderErrorState()
              ) : teamsInZone.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  title="No hay equipos en esta zona"
                  description="No hay equipos registrados en esta zona o no tienen ventas registradas."
                  actionLabel="Crear equipo"
                  actionHref="/admin/equipos/nuevo"
                  iconClassName="bg-amber-100"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Pos.</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Capitán</TableHead>
                      <TableHead className="text-right">Goles</TableHead>
                      <TableHead className="text-right">Kilos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamsInZone.map((team) => (
                      <TableRow key={team.team_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {team.position}
                            {team.position === 1 && <span className="text-lg">🥇</span>}
                            {team.position === 2 && <span className="text-lg">🥈</span>}
                            {team.position === 3 && <span className="text-lg">🥉</span>}
                          </div>
                        </TableCell>
                        <TableCell>{team.team_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{team.captain_name}</TableCell>
                        <TableCell className="text-right font-bold text-corteva-600">{team.goals}</TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {Math.round((team.total_points * 10) / 100)} kg
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grafico" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Comparativa de Equipos
              </CardTitle>
              <CardDescription>Visualización gráfica del ranking nacional</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-600"></div>
                  </div>
                ) : error ? (
                  <div className="flex justify-center items-center h-full">{renderErrorState()}</div>
                ) : teams.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <EmptyState
                      icon={Trophy}
                      title="No hay datos para mostrar"
                      description="No hay equipos con ventas registradas para mostrar en el gráfico."
                      iconClassName="bg-amber-100"
                    />
                  </div>
                ) : (
                  <AdminRankingChart teams={teams} />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Debug info - solo visible en desarrollo */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <pre className="text-xs whitespace-pre-wrap">{debugInfo}</pre>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
            Recargar datos
          </Button>
        </div>
      )}
    </div>
  )
}

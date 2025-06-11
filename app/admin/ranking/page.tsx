"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Download, Trophy, Medal, Database, BarChart3 } from "lucide-react"
import { AdminRankingChart } from "@/components/admin-ranking-chart" // Para top 3 equipos
import { AdminZonesChart } from "@/components/admin-zones-chart" // Para top 2 zonas
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
  distributor_name: string
  distributor_logo?: string
}

type Zone = {
  id: string
  name: string
  total_goals: number
  total_points: number
  teams_count: number
}

type Distributor = {
  id: string
  name: string
  logo_url?: string
}

export default function RankingAdminPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [zoneFilter, setZoneFilter] = useState("all")
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [distributorFilter, setDistributorFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("nacional")

  const [isLoadingNational, setIsLoadingNational] = useState(true)
  const [isLoadingZone, setIsLoadingZone] = useState(false)
  const [isLoadingCharts, setIsLoadingCharts] = useState(true)
  const [isLoadingZonesData, setIsLoadingZonesData] = useState(true) // Para la lista de zonas del filtro

  const [nationalRankingTeams, setNationalRankingTeams] = useState<Team[]>([])
  const [zoneRankingTeams, setZoneRankingTeams] = useState<Team[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [winningZone, setWinningZone] = useState<Zone | null>(null)
  const [top3Teams, setTop3Teams] = useState<Team[]>([])
  const [top2Zones, setTop2Zones] = useState<Zone[]>([])
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  const loadInitialData = useCallback(async () => {
    setIsLoadingNational(true)
    setIsLoadingCharts(true)
    setIsLoadingZonesData(true)
    setError(null)

    try {
      // Cargar zonas y distribuidores en paralelo
      const [{ data: zonesData, error: zonesError }, { data: distributorsData, error: distributorsError }] =
        await Promise.all([
          supabase.from("zones").select("id, name").order("name"),
          supabase.from("distributors").select("id, name, logo_url"),
        ])

      if (zonesError) throw new Error(`Error al cargar zonas: ${zonesError.message}`)
      if (distributorsError) throw new Error(`Error al cargar distribuidores: ${distributorsError.message}`)

      setZones(zonesData || [])
      setDistributors(distributorsData || [])

      // Establecer zona seleccionada por defecto si hay zonas y no hay una ya seleccionada
      if (zonesData && zonesData.length > 0 && !selectedZone) {
        setSelectedZone(zonesData[0].id)
      }
      setIsLoadingZonesData(false)

      // Cargar ranking nacional
      const rankingResult = await getTeamRankingByZone()

      if (!rankingResult.success) {
        throw new Error(rankingResult.error || "Error al cargar ranking nacional")
      }

      const teamsData = rankingResult.data || []
      console.log("DEBUG: Teams data from getTeamRankingByZone (national):", teamsData)
      setNationalRankingTeams(teamsData)
      console.log("DEBUG: National ranking teams loaded:", teamsData)
      setTop3Teams(teamsData.slice(0, 3)) // Obtener los 3 mejores equipos para el gráfico
      console.log("DEBUG: Top 3 teams for chart:", teamsData.slice(0, 3))

      // Calcular goles y puntos totales por zona para el ranking de zonas y el gráfico de zonas
      const zoneMap = new Map<string, Zone>()
      zonesData.forEach((zone) => {
        zoneMap.set(zone.id, {
          id: zone.id,
          name: zone.name,
          total_goals: 0, // Initialized to 0
          total_points: 0, // Initialized to 0
          teams_count: 0,
        })
      })

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

      console.log("DEBUG: Zone map after aggregation:", zoneMap)

      const processedZones = Array.from(zoneMap.values())
      console.log("DEBUG: Processed zones before setting state:", processedZones)
      setZones(processedZones) // Actualizar el estado de zonas con los totales calculados

      // Encontrar zona ganadora y top 2 zonas para el gráfico
      const sortedZones = [...processedZones].sort((a, b) => {
        if (b.total_goals !== a.total_goals) return b.total_goals - a.total_goals
        return b.total_points - a.total_points
      })

      const winner = sortedZones.length > 0 ? sortedZones[0] : null
      console.log("DEBUG: Winning zone calculated:", winner)

      setWinningZone(sortedZones.length > 0 ? sortedZones[0] : null)
      setTop2Zones(sortedZones.slice(0, 2)) // Obtener las 2 mejores zonas para el gráfico
      console.log("DEBUG: Top 2 zones for chart:", sortedZones.slice(0, 2))
    } catch (err: any) {
      console.error("Error cargando datos iniciales:", err)
      setError(err.message)
    } finally {
      setIsLoadingNational(false)
      setIsLoadingCharts(false)
    }
  }, [supabase, selectedZone])

  const loadZoneRanking = useCallback(async () => {
    console.log("DEBUG: Loading zone ranking for zone ID:", selectedZone)
    if (!selectedZone || selectedZone === "all") {
      setZoneRankingTeams([])
      setIsLoadingZone(false)
      return
    }

    setIsLoadingZone(true)
    setError(null)
    try {
      const rankingResult = await getTeamRankingByZone(selectedZone)
      console.log("DEBUG: Zone ranking teams loaded:", rankingResult.data)
      if (rankingResult.success) {
        setZoneRankingTeams(rankingResult.data || [])
        console.log("DEBUG: Zone ranking teams loaded:", rankingResult.data)
      } else {
        throw new Error(rankingResult.error || "Error al cargar ranking por zona")
      }
    } catch (err: any) {
      console.error("Error cargando ranking por zona:", err)
      setError(err.message)
    } finally {
      setIsLoadingZone(false)
    }
  }, [selectedZone])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    if (activeTab === "zona") {
      loadZoneRanking()
    }
  }, [activeTab, selectedZone, loadZoneRanking])

  // Filtrar equipos para la tabla nacional
  const filteredNationalTeams = nationalRankingTeams.filter((team) => {
    const matchesSearch = team.team_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesZone = zoneFilter === "all" || team.zone_id === zoneFilter
    const matchesDistributor =
      distributorFilter === "all" ||
      team.distributor_name === distributors.find((d) => d.id === distributorFilter)?.name // Asumiendo que distributor_name es único o se puede mapear

    return matchesSearch && matchesZone && matchesDistributor
  })

  const exportToExcel = () => {
    try {
      let dataToExport: any[] = []
      let fileName = ""

      if (activeTab === "nacional") {
        dataToExport = filteredNationalTeams.map((team) => ({
          Posición: team.position,
          Equipo: team.team_name,
          Distribuidor: team.distributor_name,
          Zona: team.zone_name,
          Goles: team.goals,
          "Puntos Totales": team.total_points,
          Kilos: Math.round((team.total_points * 10) / 100), // Cálculo: puntos * 10 / 100
        }))
        fileName = "ranking_nacional"
      } else if (activeTab === "zona") {
        dataToExport = zoneRankingTeams.map((team) => ({
          Posición: team.position,
          Equipo: team.team_name,
          Distribuidor: team.distributor_name,
          Zona: team.zone_name,
          Goles: team.goals,
          "Puntos Totales": team.total_points,
          Kilos: Math.round((team.total_points * 10) / 100), // Cálculo: puntos * 10 / 100
        }))
        fileName = `ranking_zona_${zones.find((z) => z.id === selectedZone)?.name || "seleccionada"}`
      } else if (activeTab === "grafico") {
        // Podríamos exportar los datos de los gráficos si es necesario
        toast({
          title: "Información",
          description: "La exportación para gráficos no está implementada directamente. Exporta desde las tablas.",
          variant: "default",
        })
        return
      }

      if (dataToExport.length === 0) {
        toast({
          title: "Error",
          description: "No hay datos para exportar",
          variant: "destructive",
        })
        return
      }

      const ws = XLSX.utils.json_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Ranking")

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/octet-stream" })

      // Create a temporary URL and trigger download
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Éxito",
        description: "Ranking exportado correctamente",
      })
    } catch (err) {
      console.error("Error exporting to Excel:", err)
      toast({
        title: "Error",
        description: "Error al exportar el ranking",
        variant: "destructive",
      })
    }
  }

  // Renderizar estado vacío
  const renderEmptyState = (title: string, description: string, actionLabel?: string, actionHref?: string) => (
    <EmptyState
      icon={Trophy}
      title={title}
      description={description}
      actionLabel={actionLabel}
      actionHref={actionHref}
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
      <Button variant="outline" className="mt-4" onClick={loadInitialData}>
        Intentar nuevamente
      </Button>
    </div>
  )

  const renderLoadingState = () => (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-600"></div>
    </div>
  )

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ranking del Concurso</h2>
          <p className="text-muted-foreground">Visualiza y gestiona el ranking de equipos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={exportToExcel}
            disabled={
              (activeTab === "nacional" && filteredNationalTeams.length === 0) ||
              (activeTab === "zona" && zoneRankingTeams.length === 0) ||
              activeTab === "grafico"
            }
          >
            <Download className="h-4 w-4" />
            Exportar Ranking
          </Button>
        </div>
      </div>

      <Tabs defaultValue="nacional" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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

            <Select value={zoneFilter} onValueChange={setZoneFilter} disabled={isLoadingZonesData}>
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

            <Select value={distributorFilter} onValueChange={setDistributorFilter} disabled={distributors.length === 0}>
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
              {isLoadingNational ? (
                renderLoadingState()
              ) : error ? (
                renderErrorState()
              ) : filteredNationalTeams.length === 0 ? (
                renderEmptyState(
                  "No hay equipos en el ranking nacional",
                  "No hay equipos registrados o no tienen ventas registradas.",
                )
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Pos.</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Zona</TableHead>
                      <TableHead className="text-right">Goles</TableHead>
                      <TableHead className="text-right">Kilos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNationalTeams.map((team) => (
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

          {winningZone && nationalRankingTeams.length > 0 && !error && (
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
              disabled={zones.length === 0 || isLoadingZonesData || !!error}
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
              {isLoadingZone ? (
                renderLoadingState()
              ) : error ? (
                renderErrorState()
              ) : zoneRankingTeams.length === 0 ? (
                renderEmptyState(
                  "No hay equipos en esta zona",
                  "No hay equipos registrados en esta zona o no tienen ventas registradas.",
                  "Crear equipo",
                  "/admin/equipos/nuevo",
                )
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Pos.</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead className="text-right">Goles</TableHead>
                      <TableHead className="text-right">Kilos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zoneRankingTeams.map((team) => (
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
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Top 3 Equipos por Goles
              </CardTitle>
              <CardDescription>Visualización de los equipos con más goles a nivel nacional</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {isLoadingCharts ? (
                  renderLoadingState()
                ) : error ? (
                  <div className="flex justify-center items-center h-full">{renderErrorState()}</div>
                ) : top3Teams.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    {renderEmptyState(
                      "No hay datos para el gráfico de equipos",
                      "Asegúrate de que haya equipos con goles registrados.",
                    )}
                  </div>
                ) : (
                  <AdminRankingChart teams={top3Teams} />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                Top 2 Zonas por Goles
              </CardTitle>
              <CardDescription>Visualización de las zonas con más goles acumulados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {isLoadingCharts ? (
                  renderLoadingState()
                ) : error ? (
                  <div className="flex justify-center items-center h-full">{renderErrorState()}</div>
                ) : top2Zones.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    {renderEmptyState(
                      "No hay datos para el gráfico de zonas",
                      "Asegúrate de que haya zonas con equipos y goles registrados.",
                    )}
                  </div>
                ) : (
                  <AdminZonesChart zonesData={top2Zones} />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { EmptyState } from "@/components/empty-state"

// Tipos para los datos
type Team = {
  id: string
  name: string
  zone_id: string
  zone_name?: string
  goals: number
  position?: number
  total_points: number
}

type Zone = {
  id: string
  name: string
  total_goals?: number
  total_points?: number
  teams_count?: number
}

export default function RankingAdminPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [zoneFilter, setZoneFilter] = useState("all")
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [distributors, setDistributors] = useState<any[]>([])
  const [distributorFilter, setDistributorFilter] = useState("all")
  const [winningZone, setWinningZone] = useState<Zone | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  // Cargar datos
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        // Cargar zonas
        const { data: zonesData, error: zonesError } = await supabase.from("zones").select("*")

        if (zonesError) throw new Error(`Error al cargar zonas: ${zonesError.message}`)

        // Cargar equipos con sus zonas
        const { data: teamsData, error: teamsError } = await supabase.from("teams").select(`
          id,
          name,
          zone_id,
          zones (
            id,
            name
          )
        `)

        if (teamsError) throw new Error(`Error al cargar equipos: ${teamsError.message}`)

        // Cargar productos para obtener los puntos
        const { data: productsData, error: productsError } = await supabase.from("products").select("id, points")

        if (productsError) throw new Error(`Error al cargar productos: ${productsError.message}`)

        // Cargar distribuidores
        const { data: distributorsData, error: distributorsError } = await supabase.from("distributors").select("*")

        if (distributorsError) throw new Error(`Error al cargar distribuidores: ${distributorsError.message}`)

        // Cargar configuración del sistema para obtener puntos por gol
        const { data: configData, error: configError } = await supabase.from("system_config").select("*").single()

        if (configError) {
          console.warn("No se pudo cargar la configuración del sistema:", configError.message)
        }

        const pointsPerGoal = configData?.points_per_goal || 100

        // Inicializar equipos con puntos en 0
        const processedTeams = teamsData.map((team) => {
          return {
            id: team.id,
            name: team.name,
            zone_id: team.zone_id,
            zone_name: team.zones?.name || "Sin zona",
            goals: 0,
            total_points: 0,
          }
        })

        // Crear un mapa de equipos para acceso rápido
        const teamsMap = new Map()
        processedTeams.forEach((team) => {
          teamsMap.set(team.id, team)
        })

        // Crear un mapa de productos para acceso rápido
        const productsMap = new Map()
        productsData.forEach((product) => {
          productsMap.set(product.id, product)
        })

        // Cargar ventas en lotes para evitar problemas con columnas específicas
        const { data: salesData, error: salesError } = await supabase.from("sales").select("*")

        if (salesError) throw new Error(`Error al cargar ventas: ${salesError.message}`)

        // Procesar ventas y acumular puntos para cada equipo
        salesData.forEach((sale) => {
          // Buscar el ID del equipo en el objeto de venta
          let teamId = null
          for (const key in sale) {
            if (key.includes("team") || key.includes("equipo")) {
              if (sale[key] && teamsMap.has(sale[key])) {
                teamId = sale[key]
                break
              }
            }
          }

          if (!teamId) return // Si no encontramos un ID de equipo válido, saltamos esta venta

          // Buscar el producto y sus puntos
          const productId = sale.product_id
          const quantity = sale.quantity || 1

          if (productId && productsMap.has(productId)) {
            const product = productsMap.get(productId)
            const points = (product.points || 0) * quantity

            // Actualizar puntos del equipo
            const team = teamsMap.get(teamId)
            if (team) {
              team.total_points += points
              team.goals = Math.floor(team.total_points / pointsPerGoal)
            }
          }
        })

        // Convertir el mapa de equipos de vuelta a un array
        const updatedTeams = Array.from(teamsMap.values())

        // Ordenar equipos por goles y luego por puntos totales
        const sortedTeams = [...updatedTeams].sort((a, b) => {
          if (b.goals !== a.goals) return b.goals - a.goals
          return b.total_points - a.total_points
        })

        // Asignar posiciones
        sortedTeams.forEach((team, index) => {
          team.position = index + 1
        })

        // Calcular goles totales por zona
        const processedZones = zonesData.map((zone) => {
          const zoneTeams = sortedTeams.filter((team) => team.zone_id === zone.id)
          const totalGoals = zoneTeams.reduce((total, team) => total + team.goals, 0)
          const totalPoints = zoneTeams.reduce((total, team) => total + team.total_points, 0)

          return {
            id: zone.id,
            name: zone.name,
            total_goals: totalGoals,
            total_points: totalPoints,
            teams_count: zoneTeams.length,
          }
        })

        // Encontrar zona ganadora
        const sortedZones = [...processedZones].sort((a, b) => {
          if (b.total_goals !== a.total_goals) return b.total_goals - a.total_goals
          return b.total_points - a.total_points
        })

        setTeams(sortedTeams)
        setZones(processedZones)
        setDistributors(distributorsData)
        setWinningZone(sortedZones.length > 0 ? sortedZones[0] : null)

        // Establecer zona seleccionada por defecto si hay zonas
        if (processedZones.length > 0 && !selectedZone) {
          setSelectedZone(processedZones[0].id)
        }
      } catch (error: any) {
        console.error("Error cargando datos:", error)
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase, selectedZone])

  // Filtrar equipos
  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesZone = zoneFilter === "all" || team.zone_id === zoneFilter
    const matchesDistributor = true // Implementar cuando tengamos la relación equipo-distribuidor

    return matchesSearch && matchesZone && matchesDistributor
  })

  // Obtener equipos de la zona seleccionada
  const teamsInSelectedZone = selectedZone
    ? teams
        .filter((team) => team.zone_id === selectedZone)
        .sort((a, b) => (b.goals || 0) - (a.goals || 0))
        .map((team, index) => ({ ...team, position: index + 1 }))
    : []

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

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ranking del Concurso</h2>
          <p className="text-muted-foreground">Visualiza y gestiona el ranking de equipos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
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
                      <div className="h-5 w-5 overflow-hidden rounded-full bg-gray-200 flex items-center justify-center">
                        {distributor.logo_url ? (
                          <img
                            src={distributor.logo_url || "/placeholder.svg"}
                            alt={`Logo ${distributor.name}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Database className="h-3 w-3 text-gray-500" />
                        )}
                      </div>
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
                      <TableHead>Zona</TableHead>
                      <TableHead className="text-right">Goles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {team.position}
                            {team.position === 1 && <span className="text-lg">🥇</span>}
                            {team.position === 2 && <span className="text-lg">🥈</span>}
                            {team.position === 3 && <span className="text-lg">🥉</span>}
                          </div>
                        </TableCell>
                        <TableCell>{team.name}</TableCell>
                        <TableCell>{team.zone_name}</TableCell>
                        <TableCell className="text-right font-bold text-corteva-600">{team.goals}</TableCell>
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
                      <div className="text-4xl font-bold text-corteva-600">{winningZone.total_goals || 0}</div>
                      <p className="text-sm text-muted-foreground">Goles totales</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold">{winningZone.teams_count || 0}</div>
                      <p className="text-sm text-muted-foreground">Equipos</p>
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
              ) : teamsInSelectedZone.length === 0 ? (
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
                      <TableHead className="text-right">Goles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamsInSelectedZone.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {team.position}
                            {team.position === 1 && <span className="text-lg">🥇</span>}
                            {team.position === 2 && <span className="text-lg">🥈</span>}
                            {team.position === 3 && <span className="text-lg">🥉</span>}
                          </div>
                        </TableCell>
                        <TableCell>{team.name}</TableCell>
                        <TableCell className="text-right font-bold text-corteva-600">{team.goals}</TableCell>
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
    </div>
  )
}

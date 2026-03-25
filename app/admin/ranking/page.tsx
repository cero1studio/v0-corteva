"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Award, Download, Target } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getTeamRankingByZone, getFreeKicksRankingByZone } from "@/app/actions/ranking"
import { getAllZones } from "@/app/actions/zones"
import { AdminRankingChart } from "@/components/admin-ranking-chart"
import { AdminZonesChart } from "@/components/admin-zones-chart"
import * as XLSX from "xlsx"
import { useCachedList } from "@/lib/global-cache"

interface Team {
  id?: string
  team_id?: string
  name?: string
  captain_name: string
  zone_name: string
  total_points: number
  position: number
  medal_type?: string
  team_name: string
  goals?: number
}

interface Zone {
  id: string
  name: string
}

export default function RankingAdminPage() {
  const [selectedZone, setSelectedZone] = useState<string>("all")

  const fetchRankingData = useCallback(async () => {
    const [teamsResult, zonesData, freeKicksResult] = await Promise.all([
      getTeamRankingByZone(),
      getAllZones(),
      getFreeKicksRankingByZone(),
    ])

    if (!teamsResult.success) {
      throw new Error("Error al cargar el ranking")
    }

    return {
      teams: teamsResult.data || [],
      zones: zonesData && Array.isArray(zonesData) ? zonesData : [],
      freeKicksRanking: freeKicksResult.success ? freeKicksResult.data || [] : [],
    }
  }, [])

  const { data, loading, error } = useCachedList("admin-ranking", fetchRankingData, [])
  const teams = data?.teams || []
  const zones = data?.zones || []
  const freeKicksRanking = data?.freeKicksRanking || []

  const filteredTeams = teams.filter((team) => {
    if (selectedZone === "all") return true
    return team.zone_name === zones.find((z) => z.id === selectedZone)?.name
  })

  const filteredFreeKicks = freeKicksRanking.filter((team) => {
    if (selectedZone === "all") return true
    return team.zone_name === zones.find((z) => z.id === selectedZone)?.name
  })

  const allOfficialScoresZero =
    filteredTeams.length > 0 && filteredTeams.every((t) => (Number(t.total_points) || 0) === 0)
  const allFreeKickScoresZero =
    filteredFreeKicks.length > 0 && filteredFreeKicks.every((t) => (Number(t.free_kick_points) || 0) === 0)

  const downloadExcel = () => {
    try {
      if (filteredTeams.length === 0 || allOfficialScoresZero) {
        toast({
          title: "Sin datos para exportar",
          description:
            filteredTeams.length === 0
              ? "No hay equipos con el filtro actual."
              : "Aún no hay puntos oficiales (ventas o clientes competencia).",
          variant: "destructive",
        })
        return
      }

      // CORREGIDO: Convertir números explícitamente a tipo number
      const excelData = filteredTeams.map((team, index) => ({
        Posición: Number(index + 1),
        Equipo: team.team_name,
        Capitán: team.captain_name,
        Zona: team.zone_name,
        "Puntos oficiales": Number(team.total_points),
        Goles: Number(team.goals ?? Math.floor(team.total_points / 100)),
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      const colWidths = [{ wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 14 }, { wch: 10 }]
      ws["!cols"] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, "Ranking")

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ranking_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)

      toast({
        title: "Éxito",
        description: "Archivo Excel descargado correctamente",
      })
    } catch (error) {
      console.error("Error downloading Excel:", error)
      toast({
        title: "Error",
        description: "Error al descargar el archivo Excel",
        variant: "destructive",
      })
    }
  }

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="h-5 w-5 flex items-center justify-center text-sm font-medium">{position}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-500 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando ranking...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rankings</h1>
          <p className="text-muted-foreground">
            Ranking oficial por ventas y clientes competencia. El premio paralelo (tiros libres) va en su propia pestaña.
          </p>
        </div>
        <Button variant="outline" onClick={downloadExcel} disabled={filteredTeams.length === 0 || allOfficialScoresZero}>
          <Download className="mr-2 h-4 w-4" />
          Descargar Excel
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Ranking oficial</TabsTrigger>
          <TabsTrigger value="tiros-libres">Premio paralelo</TabsTrigger>
          <TabsTrigger value="zona">Rendimiento por Zonas</TabsTrigger>
          <TabsTrigger value="grafico">Evolución del Concurso</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas las zonas" />
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Ranking oficial
              </CardTitle>
              <CardDescription>
                Solo ventas y clientes competencia definen posición y goles. El premio paralelo (tiros libres) está en
                su pestaña.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTeams.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No hay equipos</h3>
                  <p className="text-muted-foreground">
                    {selectedZone !== "all"
                      ? "No se encontraron equipos en la zona seleccionada"
                      : "Aún no hay equipos registrados"}
                  </p>
                </div>
              ) : allOfficialScoresZero ? (
                <div className="text-center py-12">
                  <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Aún no hay actividad oficial</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Ningún equipo tiene puntos oficiales (ventas ni clientes competencia) con el filtro actual. Cuando se
                    registren, aquí verás el ranking en lugar de una tabla llena de ceros.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Pos.</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Capitán</TableHead>
                      <TableHead>Zona</TableHead>
                      <TableHead className="text-right">Puntos oficiales</TableHead>
                      <TableHead className="text-right">Goles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.map((team, index) => (
                      <TableRow key={team.team_id ?? team.id ?? index}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">{getMedalIcon(index + 1)}</div>
                        </TableCell>
                        <TableCell className="font-medium">{team.team_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50">
                            {team.captain_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{team.zone_name}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-600">{team.total_points}</TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {team.goals ?? Math.floor(team.total_points / 100)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiros-libres" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas las zonas" />
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
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                Premio paralelo
              </CardTitle>
              <CardDescription>
                Premio paralelo al concurso: puntos por tiros libres, sin cambiar posición ni goles oficiales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFreeKicks.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No hay datos de tiros libres</h3>
                  <p className="text-muted-foreground">
                    {selectedZone !== "all"
                      ? "No hay tiros libres en la zona seleccionada"
                      : "Aún no se han otorgado tiros libres"}
                  </p>
                </div>
              ) : allFreeKickScoresZero ? (
                <div className="text-center py-12">
                  <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Sin premio paralelo aún</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Hay equipos en el filtro, pero ninguno tiene puntos de premio por tiros libres. Cuando se adjudiquen,
                    verás la clasificación aquí.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Pos.</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Capitán</TableHead>
                      <TableHead>Zona</TableHead>
                      <TableHead className="text-right">Puntos tiros libres</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFreeKicks.map((team, index) => (
                      <TableRow key={team.team_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">{getMedalIcon(index + 1)}</div>
                        </TableCell>
                        <TableCell className="font-medium">{team.team_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50">
                            {team.captain_name || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{team.zone_name}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-amber-600">{team.free_kick_points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zona" className="space-y-4">
          <AdminZonesChart />
        </TabsContent>

        <TabsContent value="grafico" className="space-y-4">
          <AdminRankingChart />
        </TabsContent>
      </Tabs>
    </div>
  )
}

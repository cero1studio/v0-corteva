"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Award, Download } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getTeamRankingByZone } from "@/app/actions/ranking"
import { getAllZones } from "@/app/actions/zones"
import { AdminRankingChart } from "@/components/admin-ranking-chart"
import { AdminZonesChart } from "@/components/admin-zones-chart"
import * as XLSX from "xlsx"

interface Team {
  id: string
  name: string
  captain_name: string
  zone_name: string
  total_points: number
  position: number
  medal_type?: string
  team_name: string
}

interface Zone {
  id: string
  name: string
}

export default function RankingAdminPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZone, setSelectedZone] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [teamsResult, zonesData] = await Promise.all([getTeamRankingByZone(), getAllZones()])

      if (teamsResult.success) {
        setTeams(teamsResult.data || [])
      } else {
        toast({
          title: "Error",
          description: "Error al cargar el ranking",
          variant: "destructive",
        })
      }

      if (zonesData && Array.isArray(zonesData)) {
        setZones(zonesData)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTeams = teams.filter((team) => {
    if (selectedZone === "all") return true
    return team.zone_name === zones.find((z) => z.id === selectedZone)?.name
  })

  const downloadExcel = () => {
    try {
      if (filteredTeams.length === 0) {
        toast({
          title: "Error",
          description: "No hay datos para exportar",
          variant: "destructive",
        })
        return
      }

      const excelData = filteredTeams.map((team, index) => ({
        Posición: index + 1,
        Equipo: team.team_name,
        Capitán: team.captain_name,
        Zona: team.zone_name,
        Goles: Math.floor(team.total_points / 100),
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      const colWidths = [
        { wch: 10 }, // Posición
        { wch: 25 }, // Equipo
        { wch: 20 }, // Capitán
        { wch: 15 }, // Zona
        { wch: 10 }, // Goles
      ]
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
          <h1 className="text-3xl font-bold tracking-tight">Ranking Nacional</h1>
          <p className="text-muted-foreground">Clasificación general de todos los equipos</p>
        </div>
        <Button variant="outline" onClick={downloadExcel} disabled={filteredTeams.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Descargar Excel
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Estadísticas Generales</TabsTrigger>
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
                Ranking Nacional
              </CardTitle>
              <CardDescription>Clasificación general de todos los equipos</CardDescription>
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
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Pos.</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Capitán</TableHead>
                      <TableHead>Zona</TableHead>
                      <TableHead className="text-right">Goles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.map((team, index) => (
                      <TableRow key={team.id}>
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
                        <TableCell className="text-right font-bold text-blue-600">
                          {Math.floor(team.total_points / 100)}
                        </TableCell>
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

"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Zap, Trophy, CheckCircle, XCircle, Download, Filter } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  createFreeKickGoal,
  getFreeKickGoals,
  deleteFreeKickGoal,
  getZones,
  getCaptainsByZone,
  getCurrentChallenge,
  exportFreeKickGoalsToExcel,
} from "@/app/actions/free-kick-goals"
import { useCachedList } from "@/lib/global-cache"
import * as XLSX from "xlsx"

interface Zone {
  id: string
  name: string
}

interface Captain {
  id: string
  full_name: string
  teams: {
    id: string
    name: string
  }
}

export default function TirosLibresPage() {
  const [captains, setCaptains] = useState<Captain[]>([])
  const [selectedZone, setSelectedZone] = useState<string>("")
  const [selectedCaptain, setSelectedCaptain] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [useChallenge, setUseChallenge] = useState(false)
  const [challengeText, setChallengeText] = useState("")
  const [reasonText, setReasonText] = useState("")
  const [exporting, setExporting] = useState(false)

  const [historyFilterZone, setHistoryFilterZone] = useState<string>("all")
  const [historyFilterKeyword, setHistoryFilterKeyword] = useState<string>("")

  const fetchData = useCallback(async () => {
    const [zonesData, goalsData] = await Promise.all([getZones(), getFreeKickGoals()])
    return { zones: zonesData, goals: goalsData }
  }, [])

  const { data, loading, error, refresh } = useCachedList("admin-free-kicks", fetchData, [])
  const zones = data?.zones || []
  const freeKickGoals = data?.goals || []

  const filteredHistoryGoals = freeKickGoals.filter((goal) => {
    console.log("[v0] Filtering goal:", {
      teamName: goal.teams.name,
      goalZoneId: goal.teams.zones?.id,
      goalZoneName: goal.teams.zones?.name,
      filterZone: historyFilterZone,
      comparison: goal.teams.zones?.id === historyFilterZone,
    })

    const matchesZone = historyFilterZone === "all" || !historyFilterZone || goal.teams.zones?.id === historyFilterZone
    const matchesKeyword =
      !historyFilterKeyword ||
      goal.reason.toLowerCase().includes(historyFilterKeyword.toLowerCase()) ||
      goal.teams.name.toLowerCase().includes(historyFilterKeyword.toLowerCase()) ||
      (goal.captain_name && goal.captain_name.toLowerCase().includes(historyFilterKeyword.toLowerCase()))

    console.log("[v0] Filter results:", { matchesZone, matchesKeyword, finalResult: matchesZone && matchesKeyword })
    return matchesZone && matchesKeyword
  })

  const teamSummary = freeKickGoals.reduce(
    (acc, goal) => {
      const teamKey = goal.team_id
      if (!acc[teamKey]) {
        acc[teamKey] = {
          teamName: goal.teams.name,
          zoneName: goal.teams.zones?.name || "Sin zona",
          captainName: goal.captain_name || "Sin capitán",
          totalPoints: 0,
          totalGoals: 0,
          count: 0,
        }
      }
      acc[teamKey].totalPoints += goal.points
      acc[teamKey].totalGoals = Math.floor(acc[teamKey].totalPoints / 100)
      acc[teamKey].count += 1
      return acc
    },
    {} as Record<string, any>,
  )

  useEffect(() => {
    async function loadCaptains() {
      if (selectedZone) {
        try {
          const captainsData = await getCaptainsByZone(selectedZone)
          setCaptains(captainsData)
          setSelectedCaptain("")
        } catch (error) {
          console.error("Error loading captains:", error)
          setMessage({ type: "error", text: "Error al cargar los capitanes" })
        }
      } else {
        setCaptains([])
        setSelectedCaptain("")
      }
    }
    loadCaptains()
  }, [selectedZone])

  useEffect(() => {
    async function loadChallenge() {
      const challenge = await getCurrentChallenge()
      setChallengeText(challenge)
    }
    loadChallenge()
  }, [])

  useEffect(() => {
    if (useChallenge && challengeText) {
      setReasonText(challengeText)
    } else if (!useChallenge) {
      setReasonText("")
    }
  }, [useChallenge, challengeText])

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true)
    setMessage(null)

    try {
      const result = await createFreeKickGoal(formData)

      if (result.success) {
        setMessage({ type: "success", text: "Tiro libre adjudicado exitosamente" })
        await refresh()
        setSelectedZone("")
        setSelectedCaptain("")
        const form = document.querySelector("form") as HTMLFormElement
        form?.reset()
      } else {
        setMessage({ type: "error", text: result.error || "Error al adjudicar tiro libre" })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setMessage({ type: "error", text: "Error inesperado" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    setMessage(null)

    try {
      const result = await deleteFreeKickGoal(id)

      if (result.success) {
        setMessage({ type: "success", text: "Tiro libre eliminado exitosamente" })
        setTimeout(async () => {
          await refresh()
        }, 100)
      } else {
        setMessage({ type: "error", text: result.error || "Error al eliminar tiro libre" })
      }
    } catch (error) {
      console.error("Error deleting goal:", error)
      setMessage({ type: "error", text: "Error inesperado al eliminar" })
    } finally {
      setDeleting(null)
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const result = await exportFreeKickGoalsToExcel()

      if (result.success && result.data) {
        const ws = XLSX.utils.json_to_sheet(result.data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Tiros Libres")
        XLSX.writeFile(wb, `tiros-libres-${new Date().toISOString().split("T")[0]}.xlsx`)

        setMessage({ type: "success", text: "Archivo Excel descargado exitosamente" })
      } else {
        setMessage({ type: "error", text: result.error || "Error al exportar datos" })
      }
    } catch (error) {
      console.error("Error exporting Excel:", error)
      setMessage({ type: "error", text: "Error al generar archivo Excel" })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tiros Libres</h1>
          <p className="text-muted-foreground">Adjudica goles adicionales a los equipos por tiros libres</p>
        </div>
        <Button onClick={handleExportExcel} disabled={exporting || freeKickGoals.length === 0} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Exportando..." : "Descargar Excel"}
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Adjudicar Tiro Libre
            </CardTitle>
            <CardDescription>Otorga goles adicionales a un equipo específico</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zone">Zona</Label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una zona" />
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

              <div className="space-y-2">
                <Label htmlFor="team_id">Capitán</Label>
                <Select
                  name="team_id"
                  value={selectedCaptain}
                  onValueChange={setSelectedCaptain}
                  disabled={!selectedZone}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedZone ? "Selecciona un capitán" : "Primero selecciona una zona"} />
                  </SelectTrigger>
                  <SelectContent>
                    {captains.map((captain) => (
                      <SelectItem key={captain.id} value={captain.teams?.id || captain.id}>
                        {captain.full_name} {captain.teams?.name ? `(${captain.teams.name})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Goles</Label>
                <Input id="goals" name="goals" type="number" min="1" max="10" placeholder="1" required />
                <p className="text-xs text-muted-foreground">Cantidad de goles a adjudicar</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Razón</Label>
                {challengeText && (
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox id="use-challenge" checked={useChallenge} onCheckedChange={setUseChallenge} />
                    <Label htmlFor="use-challenge" className="text-sm">
                      Usar texto del reto actual
                    </Label>
                  </div>
                )}
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="Describe la razón del tiro libre..."
                  value={reasonText}
                  onChange={(e) => {
                    setReasonText(e.target.value)
                    if (useChallenge) setUseChallenge(false)
                  }}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={!selectedCaptain || submitting}>
                <Zap className="mr-2 h-4 w-4" />
                {submitting ? "Adjudicando..." : "Adjudicar Tiro Libre"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Resumen por Equipo
            </CardTitle>
            <CardDescription>Goles totales adjudicados por tiros libres</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.values(teamSummary).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No hay tiros libres adjudicados</p>
              ) : (
                Object.values(teamSummary).map((summary: any, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{summary.teamName}</p>
                      <p className="text-sm text-muted-foreground">Capitán: {summary.captainName}</p>
                      <p className="text-sm text-muted-foreground">{summary.zoneName}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{summary.totalGoals} goles</Badge>
                      <p className="text-sm text-muted-foreground">{summary.count} tiros libres</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Tiros Libres</CardTitle>
          <CardDescription>Registro completo de todos los tiros libres adjudicados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4" />
              <h3 className="font-medium">Filtros</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="history-filter-zone">Filtrar por Zona</Label>
                <Select value={historyFilterZone} onValueChange={setHistoryFilterZone}>
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="history-filter-keyword">Buscar por palabra clave</Label>
                <Input
                  id="history-filter-keyword"
                  placeholder="Buscar en razón, equipo o capitán..."
                  value={historyFilterKeyword}
                  onChange={(e) => setHistoryFilterKeyword(e.target.value)}
                />
              </div>
            </div>

            {(historyFilterZone !== "all" || historyFilterKeyword) && (
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary">
                  Mostrando {filteredHistoryGoals.length} de {freeKickGoals.length} registros
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setHistoryFilterZone("all")
                    setHistoryFilterKeyword("")
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {filteredHistoryGoals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {(historyFilterZone && historyFilterZone !== "all") || historyFilterKeyword
                  ? "No hay resultados con los filtros aplicados"
                  : "No hay tiros libres registrados"}
              </p>
            ) : (
              filteredHistoryGoals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{goal.teams.name}</Badge>
                      <Badge variant="secondary">{goal.captain_name}</Badge>
                      <Badge variant="secondary">{Math.floor(goal.points / 100)} goles</Badge>
                      <Badge variant="outline">{goal.teams.zones?.name || "Sin zona"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{goal.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Por {goal.profiles?.full_name || "Admin"} • {new Date(goal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(goal.id)}
                    disabled={deleting === goal.id}
                  >
                    {deleting === goal.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

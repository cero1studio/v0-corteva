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
import { Trash2, Zap, Trophy, CheckCircle, XCircle } from "lucide-react"
import {
  createFreeKickGoal,
  getFreeKickGoals,
  deleteFreeKickGoal,
  getZones,
  getTeamsByZone,
} from "@/app/actions/free-kick-goals"
import { useCachedList } from "@/lib/global-cache"

interface Zone {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
}

export default function TirosLibresPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedZone, setSelectedZone] = useState<string>("")
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const fetchData = useCallback(async () => {
    const [zonesData, goalsData] = await Promise.all([getZones(), getFreeKickGoals()])
    return { zones: zonesData, goals: goalsData }
  }, [])

  const { data, loading, error, refresh } = useCachedList("admin-free-kicks", fetchData, [])
  const zones = data?.zones || []
  const freeKickGoals = data?.goals || []

  // Cargar equipos cuando se selecciona una zona
  useEffect(() => {
    async function loadTeams() {
      if (selectedZone) {
        try {
          const teamsData = await getTeamsByZone(selectedZone)
          setTeams(teamsData)
          setSelectedTeam("") // Reset team selection
        } catch (error) {
          console.error("Error loading teams:", error)
          setMessage({ type: "error", text: "Error al cargar los equipos" })
        }
      } else {
        setTeams([])
        setSelectedTeam("")
      }
    }
    loadTeams()
  }, [selectedZone])

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true)
    setMessage(null)

    try {
      const result = await createFreeKickGoal(formData)

      if (result.success) {
        setMessage({ type: "success", text: "Tiro libre adjudicado exitosamente" })
        // Recargar los datos
        await refresh()
        // Reset form
        setSelectedZone("")
        setSelectedTeam("")
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
        // Pequeño delay para asegurar sincronización
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

  // Agrupar por equipo para mostrar resumen
  const teamSummary = freeKickGoals.reduce(
    (acc, goal) => {
      const teamKey = goal.team_id
      if (!acc[teamKey]) {
        acc[teamKey] = {
          teamName: goal.teams.name,
          zoneName: goal.teams.zones?.name || "Sin zona",
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
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulario para adjudicar tiro libre */}
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
                <Label htmlFor="team_id">Equipo</Label>
                <Select name="team_id" value={selectedTeam} onValueChange={setSelectedTeam} disabled={!selectedZone}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedZone ? "Selecciona un equipo" : "Primero selecciona una zona"} />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
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
                <Textarea id="reason" name="reason" placeholder="Describe la razón del tiro libre..." required />
              </div>

              <Button type="submit" className="w-full" disabled={!selectedTeam || submitting}>
                <Zap className="mr-2 h-4 w-4" />
                {submitting ? "Adjudicando..." : "Adjudicar Tiro Libre"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resumen por equipo */}
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

      {/* Historial de tiros libres */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Tiros Libres</CardTitle>
          <CardDescription>Registro completo de todos los tiros libres adjudicados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {freeKickGoals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay tiros libres registrados</p>
            ) : (
              freeKickGoals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{goal.teams.name}</Badge>
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

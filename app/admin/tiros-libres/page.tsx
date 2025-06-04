"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Target, Trash2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createFreeKickGoal, getFreeKickGoals, deleteFreeKickGoal } from "@/app/actions/free-kick-goals"
import { getAllTeams } from "@/app/actions/teams"
import { EmptyState } from "@/components/empty-state"

export default function TirosLibresPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [freeKickGoals, setFreeKickGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState("")
  const [points, setPoints] = useState("")
  const [reason, setReason] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)

      // Cargar equipos
      const teamsResult = await getAllTeams()
      if (teamsResult.success) {
        setTeams(teamsResult.data || [])
      }

      // Cargar tiros libres existentes
      const goalsResult = await getFreeKickGoals()
      if (goalsResult.error) {
        console.error("Error al cargar tiros libres:", goalsResult.error)
      } else {
        setFreeKickGoals(goalsResult.data || [])
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedTeam || !points || !reason) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      })
      return
    }

    const pointsNum = Number(points)
    if (pointsNum <= 0) {
      toast({
        title: "Error",
        description: "Los puntos deben ser un número mayor a 0",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("teamId", selectedTeam)
      formData.append("points", points)
      formData.append("reason", reason)

      const result = await createFreeKickGoal(formData)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Tiro libre adjudicado",
        description: `Se han otorgado ${points} puntos al equipo seleccionado`,
      })

      // Limpiar formulario
      setSelectedTeam("")
      setPoints("")
      setReason("")

      // Recargar datos
      loadData()
    } catch (error: any) {
      console.error("Error al adjudicar tiro libre:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo adjudicar el tiro libre",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(goalId: string) {
    if (!confirm("¿Estás seguro de que quieres eliminar este tiro libre?")) {
      return
    }

    try {
      const result = await deleteFreeKickGoal(goalId)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Tiro libre eliminado",
        description: "El tiro libre ha sido eliminado correctamente",
      })

      loadData()
    } catch (error: any) {
      console.error("Error al eliminar tiro libre:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el tiro libre",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Adjudicar Tiros Libres</h2>
          <p className="text-muted-foreground">Otorga puntos adicionales a equipos por tiros libres</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-corteva-500" />
              Adjudicar Nuevo Tiro Libre
            </CardTitle>
            <CardDescription>Selecciona un equipo y otorga puntos por un tiro libre exitoso</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team">Equipo</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} - {team.zones?.name || "Sin zona"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Puntos a otorgar</Label>
                <Input
                  id="points"
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="Ej: 100"
                  min="1"
                />
                <p className="text-xs text-muted-foreground">Recuerda: 100 puntos = 1 gol</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Razón del tiro libre</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Tiro libre por excelente desempeño en ventas"
                  rows={3}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Los puntos se sumarán inmediatamente al total del equipo y aparecerán en todos los rankings.
                </AlertDescription>
              </Alert>

              <Button type="submit" disabled={submitting} className="w-full gap-2">
                {submitting ? (
                  "Adjudicando..."
                ) : (
                  <>
                    <Target className="h-4 w-4" />
                    Adjudicar Tiro Libre
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tiros Libres Recientes</CardTitle>
            <CardDescription>Últimos tiros libres adjudicados</CardDescription>
          </CardHeader>
          <CardContent>
            {freeKickGoals.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {freeKickGoals.slice(0, 10).map((goal) => (
                  <div key={goal.id} className="flex justify-between items-start border-b pb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{goal.teams?.name}</span>
                        <Badge variant="outline">{goal.teams?.zones?.name}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{goal.reason}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>+{goal.points} puntos</span>
                        <span>{new Date(goal.created_at).toLocaleDateString()}</span>
                        <span>Por: {goal.profiles?.full_name}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(goal.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="target"
                title="No hay tiros libres"
                description="Aún no se han adjudicado tiros libres a ningún equipo"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

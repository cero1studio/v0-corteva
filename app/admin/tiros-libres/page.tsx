import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Zap, Trophy } from "lucide-react"
import {
  createFreeKickGoal,
  getFreeKickGoals,
  deleteFreeKickGoal,
  getTeamsForFreeKick,
} from "@/app/actions/free-kick-goals"

async function FreeKickGoalsContent() {
  const [freeKickGoals, teams] = await Promise.all([getFreeKickGoals(), getTeamsForFreeKick()])

  // Agrupar por equipo para mostrar resumen
  const teamSummary = freeKickGoals.reduce(
    (acc, goal) => {
      const teamKey = goal.team_id
      if (!acc[teamKey]) {
        acc[teamKey] = {
          teamName: goal.teams.name,
          zone: goal.teams.zone,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tiros Libres</h1>
          <p className="text-muted-foreground">Adjudica puntos adicionales a los equipos por tiros libres</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulario para adjudicar tiro libre */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Adjudicar Tiro Libre
            </CardTitle>
            <CardDescription>Otorga puntos adicionales a un equipo específico</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createFreeKickGoal} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team_id">Equipo</Label>
                <Select name="team_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} - {team.zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Puntos</Label>
                <Input id="points" name="points" type="number" min="1" max="1000" placeholder="100" required />
                <p className="text-xs text-muted-foreground">100 puntos = 1 gol</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Razón</Label>
                <Textarea id="reason" name="reason" placeholder="Describe la razón del tiro libre..." required />
              </div>

              <Button type="submit" className="w-full">
                <Zap className="mr-2 h-4 w-4" />
                Adjudicar Tiro Libre
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
            <CardDescription>Puntos totales adjudicados por tiros libres</CardDescription>
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
                      <p className="text-sm text-muted-foreground">{summary.zone}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{summary.totalPoints} pts</Badge>
                      <p className="text-sm text-muted-foreground">{summary.totalGoals} goles</p>
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
                      <Badge variant="secondary">{goal.points} puntos</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{goal.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Por {goal.profiles.full_name} • {new Date(goal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <form action={deleteFreeKickGoal.bind(null, goal.id)}>
                    <Button variant="ghost" size="sm" type="submit">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TirosLibresPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <FreeKickGoalsContent />
    </Suspense>
  )
}

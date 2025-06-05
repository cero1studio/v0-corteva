import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Target, Plus } from "lucide-react"
import {
  createFreeKickGoal,
  getFreeKickGoals,
  deleteFreeKickGoal,
  getTeamsForFreeKick,
} from "@/app/actions/free-kick-goals"

async function FreeKickGoalsContent() {
  const [freeKickGoalsResult, teamsResult] = await Promise.all([getFreeKickGoals(), getTeamsForFreeKick()])

  const freeKickGoals = freeKickGoalsResult.data || []
  const teams = teamsResult.data || []

  return (
    <div className="space-y-6">
      {/* Formulario para adjudicar tiro libre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adjudicar Tiro Libre
          </CardTitle>
          <CardDescription>Otorga puntos adicionales a un equipo por tiro libre</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createFreeKickGoal} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="team_id">Equipo</Label>
                <Select name="team_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} - {team.zones?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Puntos</Label>
                <Input id="points" name="points" type="number" min="1" max="1000" placeholder="100" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Razón del Tiro Libre</Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="Describe la razón por la cual se otorga este tiro libre..."
                required
              />
            </div>

            <Button type="submit" className="w-full">
              <Target className="h-4 w-4 mr-2" />
              Adjudicar Tiro Libre
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de tiros libres */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Tiros Libres</CardTitle>
          <CardDescription>Todos los tiros libres adjudicados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {freeKickGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay tiros libres adjudicados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {freeKickGoals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{goal.teams?.name}</h3>
                      <Badge variant="secondary">{goal.teams?.zones?.name}</Badge>
                      <Badge variant="outline">+{goal.points} puntos</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{goal.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Por: {goal.users?.full_name} •{" "}
                      {new Date(goal.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <form action={deleteFreeKickGoal.bind(null, goal.id)}>
                    <Button variant="outline" size="sm" type="submit">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function TirosLibresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tiros Libres</h1>
        <p className="text-muted-foreground">Gestiona los goles por tiro libre adjudicados a los equipos</p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        }
      >
        <FreeKickGoalsContent />
      </Suspense>
    </div>
  )
}

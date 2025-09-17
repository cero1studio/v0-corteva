"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"

interface FreeKickGoal {
  id: string
  team_id: string
  points: number
  teams: {
    name: string
    zones?: {
      name: string
    }
  }
  captain_name?: string
}

interface TeamSummaryProps {
  freeKickGoals: FreeKickGoal[]
}

export function TeamSummary({ freeKickGoals }: TeamSummaryProps) {
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

  return (
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
  )
}

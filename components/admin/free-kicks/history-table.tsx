"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Filter } from "lucide-react"

interface Zone {
  id: string
  name: string
}

interface FreeKickGoal {
  id: string
  team_id: string
  points: number
  reason: string
  created_at: string
  teams: {
    name: string
    zones?: {
      id: string
      name: string
    }
  }
  captain_name?: string
  profiles?: {
    full_name: string
  }
}

interface HistoryTableProps {
  freeKickGoals: FreeKickGoal[]
  zones: Zone[]
  onDelete: (id: string) => Promise<void>
  deleting: string | null
}

export function HistoryTable({ freeKickGoals, zones, onDelete, deleting }: HistoryTableProps) {
  const [filterZone, setFilterZone] = useState<string>("all")
  const [filterKeyword, setFilterKeyword] = useState<string>("")

  const filteredGoals = freeKickGoals.filter((goal) => {
    const goalZoneId = goal.teams?.zones?.id
    const matchesZone = filterZone === "all" || goalZoneId === filterZone
    const matchesKeyword =
      !filterKeyword ||
      goal.reason.toLowerCase().includes(filterKeyword.toLowerCase()) ||
      goal.teams.name.toLowerCase().includes(filterKeyword.toLowerCase()) ||
      (goal.captain_name && goal.captain_name.toLowerCase().includes(filterKeyword.toLowerCase()))

    return matchesZone && matchesKeyword
  })

  return (
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
              <Label htmlFor="filter-zone">Filtrar por Zona</Label>
              <Select value={filterZone} onValueChange={setFilterZone}>
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
              <Label htmlFor="filter-keyword">Buscar por palabra clave</Label>
              <Input
                id="filter-keyword"
                placeholder="Buscar en razón, equipo o capitán..."
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
              />
            </div>
          </div>

          {(filterZone !== "all" || filterKeyword) && (
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary">
                Mostrando {filteredGoals.length} de {freeKickGoals.length} registros
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterZone("all")
                  setFilterKeyword("")
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {filteredGoals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {(filterZone && filterZone !== "all") || filterKeyword
                ? "No hay resultados con los filtros aplicados"
                : "No hay tiros libres registrados"}
            </p>
          ) : (
            filteredGoals.map((goal) => (
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
                <Button variant="ghost" size="sm" onClick={() => onDelete(goal.id)} disabled={deleting === goal.id}>
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
  )
}

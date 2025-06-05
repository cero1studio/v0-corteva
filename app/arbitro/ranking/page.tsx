"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, Crown } from "lucide-react"
import { ProtectedLayout } from "@/components/ProtectedLayout"

export default function ArbitroRanking() {
  return (
    <ProtectedLayout allowedRoles={["arbitro"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ranking General</h1>
          <p className="text-muted-foreground">Clasificación actual de todos los equipos</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="text-center">
              <Crown className="h-8 w-8 text-yellow-600 mx-auto" />
              <CardTitle className="text-yellow-800">1er Lugar</CardTitle>
              <CardDescription>Equipo Alpha</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-yellow-800">1,250</div>
              <p className="text-sm text-yellow-600">puntos</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-gray-50">
            <CardHeader className="text-center">
              <Medal className="h-8 w-8 text-gray-600 mx-auto" />
              <CardTitle className="text-gray-800">2do Lugar</CardTitle>
              <CardDescription>Equipo Beta</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-gray-800">1,180</div>
              <p className="text-sm text-gray-600">puntos</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="text-center">
              <Award className="h-8 w-8 text-orange-600 mx-auto" />
              <CardTitle className="text-orange-800">3er Lugar</CardTitle>
              <CardDescription>Equipo Gamma</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-orange-800">1,120</div>
              <p className="text-sm text-orange-600">puntos</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ranking Completo</CardTitle>
            <CardDescription>Posición de todos los equipos participantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { pos: 1, name: "Equipo Alpha", points: 1250, badge: "Oro" },
                { pos: 2, name: "Equipo Beta", points: 1180, badge: "Plata" },
                { pos: 3, name: "Equipo Gamma", points: 1120, badge: "Bronce" },
                { pos: 4, name: "Equipo Delta", points: 980, badge: null },
                { pos: 5, name: "Equipo Epsilon", points: 920, badge: null },
                { pos: 6, name: "Equipo Zeta", points: 850, badge: null },
              ].map((team) => (
                <div key={team.pos} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                      {team.pos}
                    </div>
                    <div>
                      <div className="font-medium">{team.name}</div>
                      <div className="text-sm text-muted-foreground">{team.points} puntos</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {team.badge && (
                      <Badge
                        variant={team.badge === "Oro" ? "default" : team.badge === "Plata" ? "secondary" : "outline"}
                      >
                        {team.badge}
                      </Badge>
                    )}
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  )
}

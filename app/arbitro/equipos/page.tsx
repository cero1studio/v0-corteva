"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Users, Trophy, TrendingUp } from "lucide-react"
import { ProtectedLayout } from "@/components/ProtectedLayout"

export default function ArbitroEquipos() {
  return (
    <ProtectedLayout allowedRoles={["arbitro"]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Equipos</h1>
            <p className="text-muted-foreground">Supervisa el rendimiento de todos los equipos</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar equipos..." className="pl-8" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Equipo Alpha</CardTitle>
                <Badge variant="default">Oro</Badge>
              </div>
              <CardDescription>Zona Norte • 8 miembros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    Puntos
                  </span>
                  <span className="font-medium">1,250</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Ventas
                  </span>
                  <span className="font-medium">156</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Clientes
                  </span>
                  <span className="font-medium">23</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Equipo Beta</CardTitle>
                <Badge variant="secondary">Plata</Badge>
              </div>
              <CardDescription>Zona Centro • 6 miembros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    Puntos
                  </span>
                  <span className="font-medium">1,180</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Ventas
                  </span>
                  <span className="font-medium">142</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Clientes
                  </span>
                  <span className="font-medium">19</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Equipo Gamma</CardTitle>
                <Badge variant="outline">Bronce</Badge>
              </div>
              <CardDescription>Zona Sur • 7 miembros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    Puntos
                  </span>
                  <span className="font-medium">1,120</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Ventas
                  </span>
                  <span className="font-medium">128</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Clientes
                  </span>
                  <span className="font-medium">17</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}

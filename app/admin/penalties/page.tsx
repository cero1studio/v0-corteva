import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PenaltyAssignForm } from "./penalty-assign-form"
import { PenaltyTeamList } from "./penalty-team-list"

export default function AdminPenaltiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Penaltis</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asignar Penaltis</CardTitle>
            <CardDescription>Asigna penaltis a los equipos por infracciones o comportamientos</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Cargando formulario...</div>}>
              <PenaltyAssignForm />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de Penaltis</CardTitle>
            <CardDescription>Resumen de penaltis por equipo</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Total de penaltis asignados y utilizados por cada equipo
            </p>
            {/* Aquí iría un componente de estadísticas */}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipos con Penaltis</CardTitle>
          <CardDescription>Lista de equipos con penaltis asignados</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Cargando equipos...</div>}>
            <PenaltyTeamList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

import { notFound } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PenaltyCard } from "@/components/penalty-card"
import { PenaltyHistoryList } from "@/components/penalty-history-list"
import { getTeamPenalties, getTeamPenaltyHistory } from "@/app/actions/penalties"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function TeamPenaltiesPage({ params }: { params: { teamId: string } }) {
  const { teamId } = params
  const supabase = createServerSupabaseClient()

  // Obtener información del equipo
  const { data: team } = await supabase.from("teams").select("*").eq("id", teamId).single()

  if (!team) {
    notFound()
  }

  // Obtener penaltis del equipo
  const penaltiesResult = await getTeamPenalties(teamId)
  const penalties = penaltiesResult.success ? penaltiesResult.data : []

  // Obtener historial de penaltis
  const historyResult = await getTeamPenaltyHistory(teamId)
  const history = historyResult.success ? historyResult.data : []

  // Calcular estadísticas
  const totalPenalties = penalties.reduce((sum, p) => sum + p.quantity, 0)
  const usedPenalties = penalties.reduce((sum, p) => sum + p.used, 0)
  const availablePenalties = totalPenalties - usedPenalties

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/penalties">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Penaltis de {team.name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total de Penaltis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPenalties}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Penaltis Usados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{usedPenalties}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Penaltis Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{availablePenalties}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Penaltis Asignados</h2>
          <div className="space-y-4">
            {penalties.length > 0 ? (
              penalties.map((penalty) => <PenaltyCard key={penalty.id} penalty={penalty} />)
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No hay penaltis asignados a este equipo.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div>
          <PenaltyHistoryList history={history} />
        </div>
      </div>
    </div>
  )
}

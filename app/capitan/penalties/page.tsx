"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PenaltyCard } from "@/components/penalty-card"
import { PenaltyHistoryList } from "@/components/penalty-history-list"
import { getTeamPenalties, getTeamPenaltyHistory, usePenalty } from "@/app/actions/penalties"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { PenaltyAnimation } from "@/components/penalty-animation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function CapitanPenaltiesPage() {
  const [loading, setLoading] = useState(true)
  const [penalties, setPenalties] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [teamId, setTeamId] = useState<string | null>(null)
  const [showAnimation, setShowAnimation] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [bonusGoals, setBonusGoals] = useState(0)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      // Obtener usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "No se pudo obtener la información del usuario",
          variant: "destructive",
        })
        return
      }

      // Obtener equipo del usuario
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single()

      if (profileError) throw profileError
      if (!profile || !profile.team_id) {
        toast({
          title: "Error",
          description: "No tienes un equipo asignado",
          variant: "destructive",
        })
        return
      }

      setTeamId(profile.team_id)

      // Obtener penaltis del equipo
      const penaltiesResult = await getTeamPenalties(profile.team_id)
      if (penaltiesResult.success) {
        setPenalties(penaltiesResult.data || [])
      } else {
        throw new Error(penaltiesResult.error)
      }

      // Obtener historial de penaltis
      const historyResult = await getTeamPenaltyHistory(profile.team_id)
      if (historyResult.success) {
        setHistory(historyResult.data || [])
      } else {
        throw new Error(historyResult.error)
      }
    } catch (error: any) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUsePenalty = async () => {
    if (!teamId) return

    try {
      const result = await usePenalty(teamId, 1, "Penalti reclamado por el capitán")

      if (result.success) {
        setShowAnimation(true)
        setBonusGoals(result.bonusGoals || 0)
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo usar el penalti",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error al usar penalti:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    }
  }

  const handleAnimationComplete = () => {
    setShowAnimation(false)
    setShowDialog(true)
  }

  const handleDialogClose = () => {
    setShowDialog(false)
    window.location.reload() // Recargar para mostrar los cambios
  }

  // Calcular estadísticas
  const totalPenalties = penalties.reduce((sum, p) => sum + p.quantity, 0)
  const usedPenalties = penalties.reduce((sum, p) => sum + p.used, 0)
  const availablePenalties = totalPenalties - usedPenalties

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">Mis Penaltis</h1>

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
            {availablePenalties > 0 && (
              <Button onClick={handleUsePenalty} className="mt-2 w-full">
                Reclamar Penalti
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-semibold">Penaltis Asignados</h2>
          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="pt-6 text-center">Cargando penaltis...</CardContent>
              </Card>
            ) : penalties.length > 0 ? (
              penalties.map((penalty) => <PenaltyCard key={penalty.id} penalty={penalty} />)
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No hay penaltis asignados a tu equipo.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div>
          <PenaltyHistoryList history={history} loading={loading} />
        </div>
      </div>

      <PenaltyAnimation show={showAnimation} onComplete={handleAnimationComplete} />

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <img src="/soccer-ball.png" alt="Balón" className="h-5 w-5" />
              ¡Penalti Reclamado!
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="py-4 text-center">
                <div className="text-4xl font-bold text-corteva-600 mb-2">+{bonusGoals} goles</div>
                <p>Has reclamado un penalti que te otorga un 25% adicional sobre tus goles actuales.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDialogClose}>¡Entendido!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, LineChartIcon } from "lucide-react"
import { EmptyState } from "./empty-state"

type TeamEvolutionData = {
  name: string // e.g., "Semana 1", "Enero"
  goals: number
  sales: number
  clients: number
}

type TeamDetailChartProps = {
  teamId: string // The ID of the team to display data for
}

export function TeamDetailChart({ teamId }: TeamDetailChartProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TeamEvolutionData[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
    if (teamId) {
      fetchData(teamId)
    } else {
      setError("No se proporcionó un ID de equipo.")
      setLoading(false)
    }
  }, [teamId])

  const fetchData = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const [profilesResult, salesResult, clientsResult, freeKicksResult, puntosConfigResult] = await Promise.all([
        supabase.from("profiles").select("id").eq("team_id", id),
        supabase
          .from("sales")
          .select("points, created_at, representative_id, team_id")
          .eq("team_id", id), // Direct sales to team
        supabase
          .from("competitor_clients")
          .select("id, points, created_at, representative_id, team_id")
          .eq("team_id", id), // Direct clients to team
        supabase.from("free_kick_goals").select("points, created_at, team_id").eq("team_id", id),
        supabase.from("system_config").select("value").eq("key", "puntos_para_gol").maybeSingle(),
      ])

      if (profilesResult.error) throw profilesResult.error
      if (salesResult.error) throw salesResult.error
      if (clientsResult.error) throw clientsResult.error
      if (freeKicksResult.error) throw freeKicksResult.error
      if (puntosConfigResult.error) throw puntosConfigResult.error

      const teamMembers = profilesResult.data || []
      const sales = salesResult.data || []
      const clients = clientsResult.data || []
      const freeKicks = freeKicksResult.data || []
      const puntosParaGol = puntosConfigResult.data?.value ? Number(puntosConfigResult.data.value) : 100

      // Also fetch sales and clients from team members
      const memberIds = teamMembers.map((m) => m.id)
      if (memberIds.length > 0) {
        const [memberSalesResult, memberClientsResult] = await Promise.all([
          supabase.from("sales").select("points, created_at, representative_id").in("representative_id", memberIds),
          supabase
            .from("competitor_clients")
            .select("id, points, created_at, representative_id")
            .in("representative_id", memberIds),
        ])
        if (memberSalesResult.error) console.error("Error fetching member sales:", memberSalesResult.error)
        if (memberClientsResult.error) console.error("Error fetching member clients:", memberClientsResult.error)

        sales.push(...(memberSalesResult.data || []))
        clients.push(...(memberClientsResult.data || []))
      }

      const monthlyStatsMap = new Map<string, { salesCount: number; clientsCount: number; totalPoints: number }>()

      const processEntry = (entry: any, type: "sales" | "clients" | "freeKicks") => {
        const date = new Date(entry.created_at)
        const monthYearKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}` // YYYY-MM

        const current = monthlyStatsMap.get(monthYearKey) || { salesCount: 0, clientsCount: 0, totalPoints: 0 }

        if (type === "sales") {
          current.salesCount += 1
          current.totalPoints += entry.points || 0
        } else if (type === "clients") {
          current.clientsCount += 1
          current.totalPoints += entry.points || 200 // Assuming 200 points per client
        } else if (type === "freeKicks") {
          current.totalPoints += entry.points || 0
        }
        monthlyStatsMap.set(monthYearKey, current)
      }

      sales.forEach((s) => processEntry(s, "sales"))
      clients.forEach((c) => processEntry(c, "clients"))
      freeKicks.forEach((fk) => processEntry(fk, "freeKicks"))

      const chartData: TeamEvolutionData[] = Array.from(monthlyStatsMap.entries())
        .map(([monthYearKey, stats]) => ({
          name: new Date(monthYearKey).toLocaleString("es-ES", { month: "short", year: "2-digit" }), // e.g., "ene. 23"
          sales: stats.salesCount,
          clients: stats.clientsCount,
          goals: Math.floor(stats.totalPoints / puntosParaGol),
        }))
        .sort((a, b) => {
          const [monthA, yearA] = a.name.split(". ")
          const [monthB, yearB] = b.name.split(". ")
          const dateA = new Date(`20${yearA}-${monthA}-01`)
          const dateB = new Date(`20${yearB}-${monthB}-01`)
          return dateA.getTime() - dateB.getTime()
        })

      setData(chartData)
    } catch (err: any) {
      console.error("Error al cargar datos del gráfico de detalle de equipo:", err)
      setError(`Error al cargar datos: ${err.message || "Desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted) {
    return <div className="h-[300px] flex items-center justify-center">Cargando gráfico...</div>
  }

  if (loading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Error al cargar datos"
        description={error}
        actionLabel="Reintentar"
        onClick={() => teamId && fetchData(teamId)}
        className="h-[300px]"
        iconClassName="bg-red-50"
      />
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={LineChartIcon}
        title="No hay datos para este equipo"
        description="Registra ventas, clientes o tiros libres para ver la evolución del equipo."
        className="h-[300px]"
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="goals" name="Goles" stroke="#f59e0b" strokeWidth={2} />
        <Line type="monotone" dataKey="sales" name="Ventas" stroke="#4ade80" strokeWidth={2} />
        <Line type="monotone" dataKey="clients" name="Clientes" stroke="#3b82f6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

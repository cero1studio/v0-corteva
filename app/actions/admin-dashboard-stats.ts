"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { adminSupabase } from "@/lib/supabase/server"

export type AdminBasicStats = {
  totalCapitanes: number
  totalDirectores: number
  totalTeams: number
  totalZones: number
  totalClients: number
  totalSales: number
  totalSalesPoints: number
  totalFreeKicks: number
  totalFreeKickPoints: number
  totalClientPoints: number
}

export async function getAdminDashboardBasicStats(): Promise<
  { success: true; stats: AdminBasicStats } | { success: false; error: string }
> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "admin") {
      return { success: false, error: "No autorizado" }
    }

    const fetchAllSalesPoints = async (): Promise<{ rows: { points: number | null }[]; error: Error | null }> => {
      const rows: { points: number | null }[] = []
      const PAGE = 2000
      let offset = 0
      for (;;) {
        const { data, error } = await adminSupabase
          .from("sales")
          .select("points")
          .order("id", { ascending: true })
          .range(offset, offset + PAGE - 1)
        if (error) return { rows: [], error: new Error(error.message) }
        const batch = (data ?? []) as { points: number | null }[]
        if (batch.length === 0) break
        rows.push(...batch)
        if (batch.length < PAGE) break
        offset += PAGE
      }
      return { rows, error: null }
    }

    const [capitanes, directores, teams, zones, clients, salesScan, freeKicks] = await Promise.all([
      adminSupabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "capitan"),
      adminSupabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "director_tecnico"),
      adminSupabase.from("teams").select("*", { count: "exact", head: true }),
      adminSupabase.from("zones").select("*", { count: "exact", head: true }),
      adminSupabase.from("competitor_clients").select("points"),
      fetchAllSalesPoints(),
      adminSupabase.from("free_kick_goals").select("points"),
    ])

    const queryErrors = [
      capitanes.error && `capitanes:${capitanes.error.message}`,
      directores.error && `directores:${directores.error.message}`,
      teams.error && `teams:${teams.error.message}`,
      zones.error && `zones:${zones.error.message}`,
      clients.error && `clients:${clients.error.message}`,
      salesScan.error && `sales:${salesScan.error.message}`,
      freeKicks.error && `freeKicks:${freeKicks.error.message}`,
    ].filter(Boolean) as string[]

    if (queryErrors.length > 0) {
      return { success: false, error: queryErrors.join("; ") }
    }

    const totalSalesPoints = salesScan.rows.reduce((sum, sale) => sum + (sale.points || 0), 0)
    const fkRows = (freeKicks.data ?? []) as { points: number | null }[]
    const totalFreeKickPoints = fkRows.reduce((sum, fk) => sum + (fk.points || 0), 0)
    const clientRows = (clients.data ?? []) as { points: number | null }[]
    const totalClientPoints = clientRows.reduce((sum, client) => sum + (client.points || 0), 0)

    const stats: AdminBasicStats = {
      totalCapitanes: capitanes.count || 0,
      totalDirectores: directores.count || 0,
      totalTeams: teams.count || 0,
      totalZones: zones.count || 0,
      totalClients: clients.data?.length || 0,
      totalSales: salesScan.rows.length,
      totalSalesPoints,
      totalFreeKicks: freeKicks.data?.length || 0,
      totalFreeKickPoints,
      totalClientPoints,
    }

    return { success: true, stats }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error al cargar estadísticas" }
  }
}

export async function getAdminZonesListForDashboard(): Promise<
  { success: true; data: { id: string; name: string; teams: number; total_goals: number }[] } | { success: false; error: string }
> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "admin") {
      return { success: false, error: "No autorizado" }
    }

    const { data: zones, error } = await adminSupabase.from("zones").select("id, name").order("name")
    if (error) {
      return { success: false, error: error.message }
    }

    const data = ((zones ?? []) as { id: string; name: string }[]).map((zone) => ({
      id: zone.id,
      name: zone.name,
      teams: 0,
      total_goals: 0,
    }))

    return { success: true, data }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error" }
  }
}

export type AdminProductStatRow = {
  id: string
  name: string
  sales: number
  totalPoints: number
}

export async function getAdminProductStatsForDashboard(): Promise<
  { success: true; data: AdminProductStatRow[] } | { success: false; error: string; data: [] }
> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "admin") {
      return { success: false, error: "No autorizado", data: [] }
    }

    const { data: products, error: pErr } = await adminSupabase.from("products").select("id, name").order("name")
    if (pErr) {
      return { success: false, error: pErr.message, data: [] }
    }

    type SaleAggRow = { product_id: string; quantity: number | null; points: number | null }
    const aggregates = new Map<string, { sales: number; totalPoints: number }>()
    const PAGE = 2000
    let offset = 0

    for (;;) {
      const { data: batch, error: sErr } = await adminSupabase
        .from("sales")
        .select("product_id, quantity, points")
        .order("id", { ascending: true })
        .range(offset, offset + PAGE - 1)

      if (sErr) {
        return { success: false, error: sErr.message, data: [] }
      }

      const rows = (batch ?? []) as SaleAggRow[]
      if (rows.length === 0) break

      for (const row of rows) {
        const pid = row.product_id
        if (!pid) continue
        const cur = aggregates.get(pid) ?? { sales: 0, totalPoints: 0 }
        cur.sales += row.quantity ?? 0
        cur.totalPoints += row.points ?? 0
        aggregates.set(pid, cur)
      }

      if (rows.length < PAGE) break
      offset += PAGE
    }

    const productList = (products ?? []) as { id: string; name: string }[]
    const results: AdminProductStatRow[] = productList.map((product) => {
      const agg = aggregates.get(product.id) ?? { sales: 0, totalPoints: 0 }
      return {
        id: product.id,
        name: product.name,
        sales: agg.sales,
        totalPoints: agg.totalPoints,
      }
    })

    return { success: true, data: results }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error", data: [] }
  }
}

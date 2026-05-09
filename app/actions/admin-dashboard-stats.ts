"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { adminSupabase } from "@/lib/supabase/server"

// #region agent log
function agentLog(location: string, message: string, data: Record<string, unknown>, hypothesisId: string) {
  void fetch("http://127.0.0.1:7839/ingest/47fd48bf-3efc-4b02-8644-be7f7f472876", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "cf94f3" },
    body: JSON.stringify({
      sessionId: "cf94f3",
      location,
      message,
      data,
      timestamp: Date.now(),
      hypothesisId,
      runId: "admin-dashboard",
    }),
  }).catch(() => {})
}
// #endregion

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
  // #region agent log
  agentLog("admin-dashboard-stats.ts:getAdminDashboardBasicStats", "entry", {}, "S")
  // #endregion

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "admin") {
      // #region agent log
      agentLog(
        "admin-dashboard-stats.ts:getAdminDashboardBasicStats",
        "auth_fail",
        { hasSession: !!session, role: session?.user?.role ?? "none" },
        "AUTH",
      )
      // #endregion
      return { success: false, error: "No autorizado" }
    }

    const [capitanes, directores, teams, zones, clients, sales, freeKicks] = await Promise.all([
      adminSupabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "capitan"),
      adminSupabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "director_tecnico"),
      adminSupabase.from("teams").select("*", { count: "exact", head: true }),
      adminSupabase.from("zones").select("*", { count: "exact", head: true }),
      adminSupabase.from("competitor_clients").select("points"),
      adminSupabase.from("sales").select("points"),
      adminSupabase.from("free_kick_goals").select("points"),
    ])

    const queryErrors = [
      capitanes.error && `capitanes:${capitanes.error.message}`,
      directores.error && `directores:${directores.error.message}`,
      teams.error && `teams:${teams.error.message}`,
      zones.error && `zones:${zones.error.message}`,
      clients.error && `clients:${clients.error.message}`,
      sales.error && `sales:${sales.error.message}`,
      freeKicks.error && `freeKicks:${freeKicks.error.message}`,
    ].filter(Boolean) as string[]

    if (queryErrors.length > 0) {
      // #region agent log
      agentLog("admin-dashboard-stats.ts:getAdminDashboardBasicStats", "supabase_errors", { queryErrors }, "B")
      // #endregion
      return { success: false, error: queryErrors.join("; ") }
    }

    const totalSalesPoints = sales.data?.reduce((sum, sale) => sum + (sale.points || 0), 0) || 0
    const totalFreeKickPoints = freeKicks.data?.reduce((sum, fk) => sum + (fk.points || 0), 0) || 0
    const totalClientPoints = clients.data?.reduce((sum, client) => sum + (client.points || 0), 0) || 0

    const stats: AdminBasicStats = {
      totalCapitanes: capitanes.count || 0,
      totalDirectores: directores.count || 0,
      totalTeams: teams.count || 0,
      totalZones: zones.count || 0,
      totalClients: clients.data?.length || 0,
      totalSales: sales.data?.length || 0,
      totalSalesPoints,
      totalFreeKicks: freeKicks.data?.length || 0,
      totalFreeKickPoints,
      totalClientPoints,
    }

    // #region agent log
    agentLog(
      "admin-dashboard-stats.ts:getAdminDashboardBasicStats",
      "success",
      {
        totalTeams: stats.totalTeams,
        totalZones: stats.totalZones,
        totalCapitanes: stats.totalCapitanes,
      },
      "S",
    )
    // #endregion

    return { success: true, stats }
  } catch (e) {
    // #region agent log
    agentLog(
      "admin-dashboard-stats.ts:getAdminDashboardBasicStats",
      "catch",
      { err: e instanceof Error ? e.message : "unknown" },
      "A",
    )
    // #endregion
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

    const data = (zones ?? []).map((zone) => ({
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

    const results: AdminProductStatRow[] = []
    for (const product of products ?? []) {
      const { data: salesData, error: sErr } = await adminSupabase
        .from("sales")
        .select("quantity, points")
        .eq("product_id", product.id)
      if (sErr) {
        return { success: false, error: sErr.message, data: [] }
      }
      const totalSales = salesData?.reduce((sum, sale) => sum + (sale.quantity || 0), 0) || 0
      const totalPoints = salesData?.reduce((sum, sale) => sum + (sale.points || 0), 0) || 0
      results.push({
        id: product.id,
        name: product.name,
        sales: totalSales,
        totalPoints,
      })
    }

    return { success: true, data: results }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error", data: [] }
  }
}

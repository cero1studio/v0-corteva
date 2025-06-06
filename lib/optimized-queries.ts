import { supabase } from "@/lib/supabase/client"

// Consultas optimizadas para cargar datos más rápido
export const optimizedQueries = {
  // Ranking con menos datos para carga inicial
  async getRankingPreview() {
    const { data, error } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        total_points,
        zone:zones(name),
        captain:profiles!teams_captain_id_fkey(full_name)
      `)
      .order("total_points", { ascending: false })
      .limit(10)

    if (error) throw error
    return data
  },

  // Datos del dashboard del admin optimizados
  async getAdminDashboardData() {
    const [teamsCount, usersCount, salesCount, topTeams] = await Promise.all([
      supabase.from("teams").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("sales").select("id", { count: "exact", head: true }),
      supabase.from("teams").select("id, name, total_points").order("total_points", { ascending: false }).limit(5),
    ])

    return {
      teamsCount: teamsCount.count || 0,
      usersCount: usersCount.count || 0,
      salesCount: salesCount.count || 0,
      topTeams: topTeams.data || [],
    }
  },

  // Datos del capitán optimizados
  async getCaptainDashboardData(teamId: string) {
    const [teamInfo, teamMembers, recentSales] = await Promise.all([
      supabase.from("teams").select("id, name, total_points, zone:zones(name)").eq("id", teamId).single(),
      supabase.from("profiles").select("id, full_name, role").eq("team_id", teamId),
      supabase
        .from("sales")
        .select("id, amount, created_at, product:products(name)")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    return {
      team: teamInfo.data,
      members: teamMembers.data || [],
      recentSales: recentSales.data || [],
    }
  },

  // Productos con paginación
  async getProductsPaginated(page = 0, limit = 20) {
    const from = page * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from("products")
      .select("*", { count: "exact" })
      .range(from, to)
      .order("name")

    if (error) throw error

    return {
      products: data || [],
      totalCount: count || 0,
      hasMore: (count || 0) > to + 1,
    }
  },
}

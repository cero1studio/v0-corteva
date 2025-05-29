"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function getRanking() {
  const supabase = createServerClient()

  try {
    // Obtener equipos con sus puntos totales
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        goals,
        zones (
          id,
          name
        ),
        distributors (
          id,
          name,
          logo_url
        )
      `)
      .order("goals", { ascending: false })

    if (teamsError) {
      console.error("Error al obtener equipos:", teamsError)
      return { success: false, error: teamsError.message }
    }

    // Calcular puntos totales por equipo desde las ventas
    const { data: salesData, error: salesError } = await supabase.from("sales").select(`
        team_id,
        points
      `)

    if (salesError) {
      console.error("Error al obtener ventas:", salesError)
      return { success: false, error: salesError.message }
    }

    // Agrupar puntos por equipo
    const teamPoints =
      salesData?.reduce((acc: any, sale: any) => {
        if (sale.team_id) {
          acc[sale.team_id] = (acc[sale.team_id] || 0) + (sale.points || 0)
        }
        return acc
      }, {}) || {}

    // Combinar datos de equipos con puntos
    const ranking =
      teams
        ?.map((team: any) => ({
          ...team,
          total_points: teamPoints[team.id] || 0,
        }))
        .sort((a: any, b: any) => b.total_points - a.total_points) || []

    return { success: true, data: ranking }
  } catch (error: any) {
    console.error("Error en getRanking:", error)
    return { success: false, error: error.message }
  }
}

export async function getTeamRanking(teamId: string) {
  const supabase = createServerClient()

  try {
    // Obtener información del equipo
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        goals,
        zones (
          id,
          name
        ),
        distributors (
          id,
          name,
          logo_url
        )
      `)
      .eq("id", teamId)
      .single()

    if (teamError) {
      console.error("Error al obtener equipo:", teamError)
      return { success: false, error: teamError.message }
    }

    // Obtener puntos totales del equipo
    const { data: salesData, error: salesError } = await supabase.from("sales").select("points").eq("team_id", teamId)

    if (salesError) {
      console.error("Error al obtener ventas del equipo:", salesError)
      return { success: false, error: salesError.message }
    }

    const totalPoints = salesData?.reduce((sum, sale) => sum + (sale.points || 0), 0) || 0

    // Obtener ranking general para determinar posición
    const { success: rankingSuccess, data: ranking } = await getRanking()

    if (!rankingSuccess) {
      return { success: false, error: "Error al obtener ranking general" }
    }

    const position = ranking.findIndex((t: any) => t.id === teamId) + 1

    return {
      success: true,
      data: {
        ...team,
        total_points: totalPoints,
        position: position || ranking.length + 1,
      },
    }
  } catch (error: any) {
    console.error("Error en getTeamRanking:", error)
    return { success: false, error: error.message }
  }
}

export async function getUserRanking(userId: string) {
  const supabase = createServerClient()

  try {
    // Obtener información del usuario y su equipo
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        team_id,
        teams (
          id,
          name,
          zones (
            id,
            name
          ),
          distributors (
            id,
            name,
            logo_url
          )
        )
      `)
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Error al obtener usuario:", userError)
      return { success: false, error: userError.message }
    }

    if (!user.team_id) {
      return { success: false, error: "El usuario no tiene equipo asignado" }
    }

    // Obtener puntos del usuario
    const { data: userSales, error: userSalesError } = await supabase
      .from("sales")
      .select("points")
      .eq("representative_id", userId)

    if (userSalesError) {
      console.error("Error al obtener ventas del usuario:", userSalesError)
      return { success: false, error: userSalesError.message }
    }

    const userPoints = userSales?.reduce((sum, sale) => sum + (sale.points || 0), 0) || 0

    // Obtener ranking del equipo
    const { success: teamRankingSuccess, data: teamRanking } = await getTeamRanking(user.team_id)

    if (!teamRankingSuccess) {
      return { success: false, error: "Error al obtener ranking del equipo" }
    }

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          points: userPoints,
        },
        team: teamRanking,
      },
    }
  } catch (error: any) {
    console.error("Error en getUserRanking:", error)
    return { success: false, error: error.message }
  }
}

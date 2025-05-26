import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Obtener la configuración de puntos para un gol
    const { data: puntosConfig, error: puntosError } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "puntos_para_gol")
      .maybeSingle()

    // Por defecto 100 puntos = 1 gol si no hay configuración
    const puntosParaGol = puntosConfig?.value ? Number(puntosConfig.value) : 100

    // Obtener todos los equipos
    const { data: teams, error: teamsError } = await supabase.from("teams").select("id, name")

    if (teamsError) {
      return NextResponse.json({ error: "Error al obtener equipos" }, { status: 500 })
    }

    const results = []

    // Para cada equipo, calcular sus puntos totales y actualizar
    for (const team of teams || []) {
      // Obtener todos los usuarios del equipo
      const { data: teamUsers, error: usersError } = await supabase.from("profiles").select("id").eq("team_id", team.id)

      if (usersError) {
        results.push({ team: team.name, error: "Error al obtener usuarios" })
        continue
      }

      let totalTeamPoints = 0

      // Para cada usuario, obtener sus ventas y sumar puntos
      for (const user of teamUsers || []) {
        const { data: userSales, error: salesError } = await supabase
          .from("sales")
          .select("points")
          .eq("user_id", user.id)

        if (salesError) {
          results.push({ team: team.name, user: user.id, error: "Error al obtener ventas" })
          continue
        }

        // Sumar puntos de este usuario
        const userPoints = userSales ? userSales.reduce((sum, sale) => sum + (sale.points || 0), 0) : 0
        totalTeamPoints += userPoints
      }

      // Calcular goles
      const goals = Math.floor(totalTeamPoints / puntosParaGol)

      // Actualizar el equipo
      const { error: updateError } = await supabase
        .from("teams")
        .update({
          total_points: totalTeamPoints,
          goals: goals,
        })
        .eq("id", team.id)

      if (updateError) {
        results.push({
          team: team.name,
          error: "Error al actualizar equipo",
          details: updateError.message,
        })
      } else {
        results.push({
          team: team.name,
          success: true,
          points: totalTeamPoints,
          goals: goals,
        })
      }
    }

    return NextResponse.json({
      message: "Proceso completado",
      results: results,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

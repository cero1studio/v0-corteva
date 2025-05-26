import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, teamId, quantity, description } = body

    if (action === "use") {
      const cookieStore = cookies()
      const supabase = createServerClient(cookieStore)

      // Obtener goles actuales del equipo
      const { data: team, error: teamError } = await supabase.from("teams").select("goals").eq("id", teamId).single()

      if (teamError) {
        return NextResponse.json({ success: false, error: teamError.message })
      }

      // Obtener el penalti disponible
      const { data: penalty, error: penaltyError } = await supabase
        .from("penalties")
        .select("*")
        .eq("team_id", teamId)
        .gt("quantity", 0)
        .order("created_at", { ascending: true })
        .limit(1)
        .single()

      if (penaltyError || !penalty) {
        return NextResponse.json({ success: false, error: "No hay penaltis disponibles" })
      }

      // Calcular bonus (25% de los goles actuales)
      const currentGoals = team.goals || 0
      const bonusGoals = Math.floor(currentGoals * 0.25)

      // Actualizar el penalti
      const { error: updateError } = await supabase
        .from("penalties")
        .update({ quantity: penalty.quantity - quantity })
        .eq("id", penalty.id)

      if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message })
      }

      // Actualizar goles del equipo
      const { error: goalsError } = await supabase
        .from("teams")
        .update({ goals: currentGoals + bonusGoals })
        .eq("id", teamId)

      if (goalsError) {
        return NextResponse.json({ success: false, error: goalsError.message })
      }

      // Registrar en el historial
      await supabase.from("penalty_history").insert({
        penalty_id: penalty.id,
        team_id: teamId,
        action: "used",
        quantity: quantity,
        description: description,
      })

      return NextResponse.json({ success: true, bonusGoals })
    }

    return NextResponse.json({ success: false, error: "Acción no válida" })
  } catch (error: any) {
    console.error("Error en API de penaltis:", error)
    return NextResponse.json({ success: false, error: error.message })
  }
}

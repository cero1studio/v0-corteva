import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")

    if (!teamId) {
      return NextResponse.json({ error: "Se requiere el ID del equipo" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase
      .from("penalties")
      .select(`
        id,
        team_id,
        quantity,
        used,
        reason,
        created_at
      `)
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener penaltis:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error al procesar la solicitud:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
    const { teamId, quantity = 1, reason = "Penalti reclamado" } = await request.json()

    if (!teamId) {
      return NextResponse.json({ error: "El ID del equipo es requerido" }, { status: 400 })
    }

    // Obtener penaltis disponibles
    const { data: penalties, error: penaltiesError } = await supabase
      .from("penalties")
      .select("id, quantity, used")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true })

    if (penaltiesError) {
      console.error("Error al obtener penaltis:", penaltiesError)
      return NextResponse.json({ error: penaltiesError.message }, { status: 500 })
    }

    // Verificar si hay penaltis disponibles
    let penaltyToUse = null
    for (const penalty of penalties) {
      if (penalty.used < penalty.quantity) {
        penaltyToUse = penalty
        break
      }
    }

    if (!penaltyToUse) {
      return NextResponse.json({ error: "No hay penaltis disponibles" }, { status: 400 })
    }

    // Actualizar el penalti
    const { error: updateError } = await supabase
      .from("penalties")
      .update({ used: penaltyToUse.used + 1 })
      .eq("id", penaltyToUse.id)

    if (updateError) {
      console.error("Error al usar penalti:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error al procesar la solicitud:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

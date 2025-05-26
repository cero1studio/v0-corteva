import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Se requiere el ID del usuario" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase
      .from("competitor_clients")
      .select("*")
      .eq("captured_by", userId)
      .order("capture_date", { ascending: false })

    if (error) {
      console.error("Error al obtener clientes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error al procesar la solicitud:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

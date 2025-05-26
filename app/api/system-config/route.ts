import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (!key) {
      return NextResponse.json({ error: "Se requiere el key de configuración" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase.from("system_config").select("value").eq("key", key).single()

    if (error) {
      console.error("Error al obtener configuración:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data.value })
  } catch (error: any) {
    console.error("Error al procesar la solicitud:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ error: "Se requiere el key de configuración" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Primero verificamos si ya existe una configuración con ese key
    const { data: existingConfig, error: checkError } = await supabase
      .from("system_config")
      .select("id")
      .eq("key", key)
      .maybeSingle()

    if (checkError) {
      console.error("Error al verificar configuración existente:", checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    let result
    if (existingConfig) {
      // Actualizar configuración existente
      result = await supabase
        .from("system_config")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key)
    } else {
      // Crear nueva configuración
      result = await supabase.from("system_config").insert({
        key,
        value,
        description: `Configuración para ${key}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    if (result.error) {
      console.error("Error al guardar configuración:", result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Configuración guardada correctamente" })
  } catch (error: any) {
    console.error("Error al procesar la solicitud:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

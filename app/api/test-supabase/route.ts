import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServerClient()

    console.log("=== DIAGNÓSTICO DE SUPABASE ===")
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Configurada" : "✗ No configurada")
    console.log("Service Role Key:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Configurada" : "✗ No configurada")

    // Probar conexión básica
    const { data, error } = await supabase.from("profiles").select("count").limit(1)

    if (error) {
      console.error("Error de conexión:", error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
      })
    }

    // Probar permisos de admin
    try {
      const { data: authTest, error: authError } = await supabase.auth.admin.listUsers()

      if (authError) {
        console.error("Error de permisos admin:", authError)
        return NextResponse.json({
          success: false,
          error: "Sin permisos de administrador",
          details: authError,
        })
      }

      console.log("Permisos de admin: ✓ Correctos")
    } catch (adminError) {
      console.error("Error al probar admin:", adminError)
      return NextResponse.json({
        success: false,
        error: "Error al verificar permisos de admin",
        details: adminError,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Configuración de Supabase correcta",
      config: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        connection: "OK",
        adminPermissions: "OK",
      },
    })
  } catch (error: any) {
    console.error("Error en diagnóstico:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error,
    })
  }
}

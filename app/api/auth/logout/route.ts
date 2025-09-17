import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Crear cliente de Supabase para server-side
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Limpiar cookies
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    // Crear respuesta con redirect
    const response = NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    )

    // Limpiar todas las cookies relacionadas con auth
    allCookies.forEach((cookie) => {
      if (cookie.name.includes("supabase") || cookie.name.includes("auth")) {
        response.cookies.delete(cookie.name)
      }
    })

    // Limpiar cookies específicas de Supabase
    response.cookies.delete("supabase-auth-token")
    response.cookies.delete("supabase.auth.token")
    response.cookies.delete("sb-access-token")
    response.cookies.delete("sb-refresh-token")

    return response
  } catch (error) {
    console.error("Error en logout:", error)
    // Incluso si hay error, redirigir a login
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"))
  }
}

export async function GET() {
  // También permitir GET para casos donde se use window.location.href
  return POST()
}

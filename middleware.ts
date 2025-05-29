import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/types/supabase"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Crear cliente de Supabase para middleware
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options })
        },
      },
    },
  )

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // Si hay error de sesión, solo limpiar cookies pero NO redirigir
    if (sessionError) {
      console.log("Middleware: Error de sesión:", sessionError.message)

      if (sessionError.message?.includes("refresh_token") || sessionError.message?.includes("invalid_grant")) {
        res.cookies.delete("supabase-auth-token")
        res.cookies.delete("supabase.auth.token")
      }

      // NO redirigir, dejar que el cliente maneje el estado
      return res
    }

    // Rutas públicas que no requieren autenticación
    const publicRoutes = [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/primer-acceso",
      "/ranking-publico",
    ]
    const isPublicRoute = publicRoutes.some((route) => req.nextUrl.pathname.startsWith(route))

    // Si no hay sesión y no es una ruta pública, NO redirigir automáticamente
    // Dejar que el cliente maneje el estado de autenticación
    if (!session && !isPublicRoute) {
      console.log("Middleware: Usuario sin sesión en ruta protegida, pero NO redirigiendo")
      // Solo continuar, el cliente decidirá qué hacer
      return res
    }

    // Si hay sesión, verificar permisos de rol pero NO redirigir automáticamente
    if (session) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, team_id")
          .eq("id", session.user.id)
          .single()

        if (profileError) {
          console.error("Error al obtener perfil en middleware:", profileError)
          // NO redirigir, permitir continuar
          return res
        }

        console.log(`Middleware: Usuario ${session.user.email} con rol ${profile?.role}`)

        // Verificar acceso a rutas protegidas por rol
        // Solo bloquear si definitivamente no tiene acceso
        if (req.nextUrl.pathname.startsWith("/admin") && profile?.role !== "admin") {
          console.log(`Middleware: Acceso no autorizado a /admin para rol ${profile?.role}`)

          // En lugar de redirigir, devolver 403
          return new NextResponse("Acceso no autorizado", { status: 403 })
        }

        if (req.nextUrl.pathname.startsWith("/capitan") && profile?.role !== "capitan") {
          console.log(`Middleware: Acceso no autorizado a /capitan para rol ${profile?.role}`)

          // En lugar de redirigir, devolver 403
          return new NextResponse("Acceso no autorizado", { status: 403 })
        }

        // Agregar más verificaciones de roles si es necesario...
      } catch (error) {
        console.error("Error en middleware al obtener perfil:", error)
        // En caso de error, permitimos continuar
        return res
      }
    }

    return res
  } catch (error) {
    console.error("Error general en middleware:", error)
    return res
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}

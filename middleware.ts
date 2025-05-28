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

    // Si hay error de sesión (como refresh token), limpiar y continuar
    if (sessionError) {
      console.log("Middleware: Error de sesión:", sessionError.message)

      // Si es error de refresh token, limpiar cookies y continuar
      if (sessionError.message?.includes("refresh_token") || sessionError.message?.includes("invalid_grant")) {
        // Limpiar cookies de autenticación
        res.cookies.delete("supabase-auth-token")
        res.cookies.delete("supabase.auth.token")

        // Si no es ruta pública, redirigir a login
        const publicRoutes = [
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/primer-acceso",
          "/ranking-publico",
        ]
        const isPublicRoute = publicRoutes.some((route) => req.nextUrl.pathname.startsWith(route))

        if (!isPublicRoute) {
          return NextResponse.redirect(new URL("/login", req.url))
        }

        return res
      }
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

    // Si no hay sesión y no es una ruta pública, redirigir a login
    if (!session && !isPublicRoute) {
      console.log("Middleware: Usuario sin sesión, redirigiendo a /login")
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Si hay sesión
    if (session) {
      try {
        // Obtener el perfil del usuario
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, team_id")
          .eq("id", session.user.id)
          .single()

        // Si hay error al obtener el perfil, permitir continuar pero registrar el error
        if (profileError) {
          console.error("Error al obtener perfil en middleware:", profileError)
          // No redirigimos, permitimos continuar
          return res
        }

        console.log(`Middleware: Usuario ${session.user.email} con rol ${profile?.role}`)

        // Si está en login y ya tiene sesión, redirigir según rol
        if (req.nextUrl.pathname.startsWith("/login")) {
          let redirectUrl = "/login" // Default fallback

          switch (profile?.role) {
            case "admin":
              redirectUrl = "/admin/dashboard"
              break
            case "capitan":
              redirectUrl = profile.team_id ? "/capitan/dashboard" : "/capitan/crear-equipo"
              break
            case "director_tecnico":
              redirectUrl = "/director-tecnico/dashboard"
              break
            case "supervisor":
              redirectUrl = "/supervisor/dashboard"
              break
            case "representante":
              redirectUrl = "/representante/dashboard"
              break
            default:
              console.log(`Rol desconocido: ${profile?.role}`)
              redirectUrl = "/login"
          }

          if (redirectUrl !== "/login") {
            console.log(`Middleware: Redirigiendo desde /login a ${redirectUrl}`)
            return NextResponse.redirect(new URL(redirectUrl, req.url))
          }
        }

        // Verificar acceso a rutas protegidas por rol
        if (req.nextUrl.pathname.startsWith("/admin") && profile?.role !== "admin") {
          console.log(`Middleware: Acceso no autorizado a /admin para rol ${profile?.role}`)

          // Redirigir según rol
          let redirectUrl = "/login"
          switch (profile?.role) {
            case "capitan":
              redirectUrl = profile.team_id ? "/capitan/dashboard" : "/capitan/crear-equipo"
              break
            case "director_tecnico":
              redirectUrl = "/director-tecnico/dashboard"
              break
            case "supervisor":
              redirectUrl = "/supervisor/dashboard"
              break
            case "representante":
              redirectUrl = "/representante/dashboard"
              break
          }

          return NextResponse.redirect(new URL(redirectUrl, req.url))
        }

        // Verificar otras rutas protegidas...
        if (req.nextUrl.pathname.startsWith("/capitan") && profile?.role !== "capitan") {
          console.log(`Middleware: Acceso no autorizado a /capitan para rol ${profile?.role}`)

          let redirectUrl = "/login"
          switch (profile?.role) {
            case "admin":
              redirectUrl = "/admin/dashboard"
              break
            case "director_tecnico":
              redirectUrl = "/director-tecnico/dashboard"
              break
            case "supervisor":
              redirectUrl = "/supervisor/dashboard"
              break
            case "representante":
              redirectUrl = "/representante/dashboard"
              break
          }

          return NextResponse.redirect(new URL(redirectUrl, req.url))
        }

        // Continuar con otras verificaciones de rutas...
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

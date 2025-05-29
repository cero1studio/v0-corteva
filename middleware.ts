import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/types/supabase"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

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
    }
  )

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    const publicRoutes = [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/primer-acceso",
      "/ranking-publico",
    ]
    const isPublicRoute = publicRoutes.some((route) => req.nextUrl.pathname.startsWith(route))

    // Si hay error con el refresh token
    if (sessionError?.message?.includes("refresh_token") || sessionError?.message?.includes("invalid_grant")) {
      const redirectRes = NextResponse.redirect(new URL("/login", req.url))
      redirectRes.cookies.delete("supabase-auth-token")
      redirectRes.cookies.delete("supabase.auth.token")

      return isPublicRoute ? res : redirectRes
    }

    // Si no hay sesión y no es ruta pública
    if (!session && !isPublicRoute) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Si hay sesión
    if (session) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, team_id")
        .eq("id", session.user.id)
        .single()

      if (profileError) {
        console.error("Error al obtener perfil en middleware:", profileError)
        return res
      }

      const role = profile?.role

      const redirects: Record<string, string> = {
        admin: "/admin/dashboard",
        capitan: profile?.team_id ? "/capitan/dashboard" : "/capitan/crear-equipo",
        director_tecnico: "/director-tecnico/dashboard",
        supervisor: "/supervisor/dashboard",
        representante: "/representante/dashboard",
      }

      const roleAccessPaths: Record<string, string> = {
        "/admin": "admin",
        "/capitan": "capitan",
        "/director-tecnico": "director_tecnico",
        "/supervisor": "supervisor",
        "/representante": "representante",
      }

      for (const path in roleAccessPaths) {
        if (req.nextUrl.pathname.startsWith(path) && role !== roleAccessPaths[path]) {
          return NextResponse.redirect(new URL(redirects[role] || "/login", req.url))
        }
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

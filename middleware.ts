import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/primer-acceso", "/ranking-publico"]

// Mapeo de roles a sus dashboards
const roleDashboards: Record<string, string> = {
  admin: "/admin/dashboard",
  capitan: "/capitan/dashboard",
  director_tecnico: "/director-tecnico/dashboard",
  arbitro: "/arbitro/dashboard",
  supervisor: "/supervisor/dashboard",
  representante: "/representante/dashboard",
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Permitir siempre las rutas de la API de NextAuth
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Verificar si es ruta pública
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Obtener el token JWT
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Log para debug - verificar si el middleware se ejecuta y detecta token
  if (pathname === "/login") {
    console.log("[MIDDLEWARE] Login page accessed, token:", token ? "exists" : "missing", token ? `role: ${token.role}` : "")
  }

  // Si no hay token y no es ruta pública, redirigir a login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  // Si hay token y está en login, redirigir a su dashboard
  if (token && pathname === "/login") {
    const role = token.role as string
    const teamId = token.team_id as string | null
    
    console.log("[MIDDLEWARE] User logged in, role:", role, "teamId:", teamId, "token keys:", Object.keys(token))
    
    if (!role) {
      console.error("[MIDDLEWARE] Token exists but no role found!")
      return NextResponse.next()
    }
    
    // Caso especial: capitán sin equipo va a crear equipo
    if (role === "capitan" && !teamId) {
      console.log("[MIDDLEWARE] Redirecting capitan without team to /capitan/crear-equipo")
      return NextResponse.redirect(new URL("/capitan/crear-equipo", req.url))
    }
    
    const dashboardUrl = roleDashboards[role] || "/login"
    console.log("[MIDDLEWARE] Redirecting to dashboard:", dashboardUrl)
    return NextResponse.redirect(new URL(dashboardUrl, req.url))
  }

  // Verificar acceso basado en roles
  if (token && !isPublicRoute) {
    const role = token.role as string

    if (!role) {
      console.error("[MIDDLEWARE] Token exists but no role, redirecting to login")
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Mapeo de rutas protegidas por rol
    const roleRoutes: Record<string, string[]> = {
      admin: ["/admin"],
      capitan: ["/capitan"],
      director_tecnico: ["/director-tecnico"],
      arbitro: ["/arbitro"],
      supervisor: ["/supervisor"],
      representante: ["/representante"],
    }

    const allowedRoutes = roleRoutes[role] || []
    const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route))

    // Si no tiene acceso, redirigir a su dashboard
    if (!hasAccess) {
      const dashboardUrl = roleDashboards[role] || "/login"
      console.log(`[MIDDLEWARE] User with role '${role}' tried to access '${pathname}', redirecting to ${dashboardUrl}`)
      return NextResponse.redirect(new URL(dashboardUrl, req.url))
    }

    // Capitán con JWT desfasado (sin team_id): permitir toda el área /capitan.
    // El menú usa /capitan/ventas, /capitan/clientes, etc.; antes solo se exceptuaba registrar-* y acababan en crear-equipo → dashboard.
    // La BD y cada página validan permisos; login sigue mandando sin equipo a crear-equipo.
  }

  return NextResponse.next()
}

// Configurar matcher para interceptar solo rutas necesarias
export const config = {
  matcher: [
    /*
     * Interceptar todas las rutas excepto:
     * - api/auth (rutas de NextAuth)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - archivos públicos (imágenes, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp).*)",
  ],
}

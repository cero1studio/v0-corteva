"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function UserProfile() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadUserData() {
      setIsLoading(true)
      try {
        // Obtener la sesión actual
        const { data: sessionData } = await supabase.auth.getSession()

        if (!sessionData.session) {
          setIsLoading(false)
          return
        }

        // Obtener el perfil del usuario
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionData.session.user.id)
          .single()

        if (error) {
          console.error("Error al cargar el perfil:", error)
          setIsLoading(false)
          return
        }

        // Si es capitán, obtener el nombre del equipo
        let teamName = null
        if (profile.role === "capitan" && profile.team_id) {
          const { data: team } = await supabase.from("teams").select("name").eq("id", profile.team_id).single()

          if (team) {
            teamName = team.name
          }
        }

        setUser({
          id: sessionData.session.user.id,
          email: sessionData.session.user.email,
          name: profile.name,
          role: profile.role,
          teamName,
        })
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])

  const handleSignOut = async () => {
    try {
      console.log("Cerrando sesión desde user profile...")
      await supabase.auth.signOut()
      // Limpiar cualquier estado local
      setUser(null)
      // Forzar redirección
      window.location.href = "/login"
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      // Forzar redirección incluso si hay error
      window.location.href = "/login"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border p-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-8 ml-2" />
      </div>
    )
  }

  if (!user) return null

  // Determinar qué mostrar según el rol
  const displayName =
    user.role === "admin" ? user.email?.split("@")[0] || "Admin" : user.name || user.email?.split("@")[0] || "Usuario"

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border p-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src="/placeholder.svg" alt={displayName} />
        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{displayName}</span>
        {user.role === "admin" && <span className="text-xs text-muted-foreground">Administrador</span>}
        {user.role === "capitan" && user.teamName && (
          <span className="text-xs text-muted-foreground">{user.teamName}</span>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={handleSignOut} className="ml-2">
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Cerrar Sesión</span>
      </Button>
    </div>
  )
}

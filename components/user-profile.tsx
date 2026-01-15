"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/useAuth"

export function UserProfile() {
  const { profile, isLoading, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
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

  if (!profile) return null

  // Determinar qué mostrar según el rol
  const displayName =
    profile.role === "admin"
      ? profile.email?.split("@")[0] || "Admin"
      : profile.full_name || profile.email?.split("@")[0] || "Usuario"

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
        {profile.role === "admin" && <span className="text-xs text-muted-foreground">Administrador</span>}
        {profile.role === "capitan" && profile.team_name && (
          <span className="text-xs text-muted-foreground">{profile.team_name}</span>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={handleSignOut} className="ml-2">
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Cerrar Sesión</span>
      </Button>
    </div>
  )
}

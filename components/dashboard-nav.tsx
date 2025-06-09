"use client"

import Link from "next/link"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { User } from "lucide-react"

export function DashboardNav() {
  const { data: session } = useSession()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-xs">
        <SheetHeader>
          <SheetTitle>Dashboard</SheetTitle>
          <SheetDescription>Manage your account settings and set preferences.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            Dashboard
          </Link>
          <Link
            href="/billing"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            Billing
          </Link>
          <Link
            href="/perfil"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <User className="h-4 w-4" />
            Mi Perfil
          </Link>
          <Button variant="outline" onClick={() => signOut()} className="w-full justify-start">
            Cerrar Sesión
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

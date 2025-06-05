"use client"

import { BarChart, Puzzle, Settings, User2, Zap } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Shell } from "@/components/ui/shell"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function DashboardNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role

  return (
    <Shell className="border-r">
      <ScrollArea className="h-[calc(100vh-var(--header-height))] py-4">
        <div className="flex flex-col space-y-4">
          <div className="px-3 py-2">
            <Link href="/dashboard" className="flex items-center space-x-2 px-3.5 py-2 text-sm font-medium">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image ?? ""} />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <span>{session?.user?.name}</span>
            </Link>
          </div>
          <Separator />
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname === "/dashboard" ? "bg-muted text-primary" : "",
              )}
            >
              <BarChart className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/account"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname === "/account" ? "bg-muted text-primary" : "",
              )}
            >
              <User2 className="h-4 w-4" />
              Cuenta
            </Link>
            <Link
              href="/retos"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname === "/retos" ? "bg-muted text-primary" : "",
              )}
            >
              <Puzzle className="h-4 w-4" />
              Retos
            </Link>
            {userRole === "admin" && (
              <Link
                href="/admin/tiros-libres"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === "/admin/tiros-libres" ? "bg-muted text-primary" : "",
                )}
              >
                <Zap className="h-4 w-4" />
                Tiros Libres
              </Link>
            )}
          </div>
          <Separator />
          <div className="space-y-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="justify-start px-3 py-2">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Ajustes</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60">
                <DropdownMenuItem>
                  <Link href="/settings/profile">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings/appearance">Apariencia</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/settings/notifications">Notificaciones</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings/integrations">Integraciones</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </ScrollArea>
    </Shell>
  )
}

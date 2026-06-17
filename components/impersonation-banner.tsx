"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { ShieldAlert } from "lucide-react"

export function ImpersonationBanner() {
  const { data: session, update } = useSession()
  const router = useRouter()

  if (!session?.user?.original_admin_id) {
    return null
  }

  async function handleRestoreAdmin() {
    await update({ restoreAdmin: true })
    router.push("/admin/dashboard")
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white p-4 rounded-lg shadow-xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 font-medium">
        <ShieldAlert className="h-5 w-5" />
        Estás navegando como: {session.user.name}
      </div>
      <Button 
        variant="secondary" 
        size="sm" 
        className="w-full font-bold text-red-600"
        onClick={handleRestoreAdmin}
      >
        Volver a Administrador
      </Button>
    </div>
  )
}

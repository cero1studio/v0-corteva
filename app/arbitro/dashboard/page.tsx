"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export default function ArbitroDashboard() {
  const router = useRouter()
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.role === "arbitro") {
      router.replace("/director-tecnico/dashboard")
    }
  }, [profile, router])

  return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
    </div>
  )
}

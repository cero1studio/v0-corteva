"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { redirect } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { Profile } from "@/app/components/Profile"
import DashboardNav from "@/app/components/DashboardNav"

interface Props {
  children: React.ReactNode
}

const allowedRoles = ["director_tecnico", "arbitro"]

export default function DirectorTecnicoLayout({ children }: Props) {
  return (
    <SessionProvider>
      <AuthCheck allowedRoles={allowedRoles}>
        <DirectorTecnicoDashboard>{children}</DirectorTecnicoDashboard>
      </AuthCheck>
    </SessionProvider>
  )
}

function AuthCheck({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const session = useSession()
  const isAllowed =
    session.status === "authenticated" &&
    session?.data?.user?.role &&
    allowedRoles.includes(session.data.user.role as string)

  useEffect(() => {
    if (session.status === "loading") {
      return
    }

    if (session.status === "unauthenticated") {
      redirect("/login")
    }

    if (!isAllowed) {
      redirect("/")
    }
  }, [session.status, isAllowed])

  if (isAllowed) {
    return <>{children}</>
  }

  return <></>
}

function DirectorTecnicoDashboard({ children }: { children: React.ReactNode }) {
  return (
    <Profile>
      {(profile) => {
        if (!profile) return <div>Loading profile...</div>

        return (
          <div className="flex h-screen bg-base-200">
            <DashboardNav role={profile.role as "director_tecnico" | "arbitro"} />
            <main className="flex-1 p-4">{children}</main>
          </div>
        )
      }}
    </Profile>
  )
}

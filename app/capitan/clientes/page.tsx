import { getCapitanClientsForSession } from "@/app/actions/clients"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { adminSupabase } from "@/lib/supabase/server"
import ClientesClientPage from "./client-page"

export const dynamic = 'force-dynamic'

export default async function ClientesPageServer() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return <div>No autorizado</div>
  }

  let teamId = session.user.team_id ?? null
  if (!teamId && session.user.role === "capitan") {
    const { data: row } = await adminSupabase
      .from("profiles")
      .select("team_id")
      .eq("id", session.user.id)
      .maybeSingle()
    teamId = row?.team_id ?? null
  }

  const result = await getCapitanClientsForSession()
  const initialClients = result.success ? result.data : []

  return (
    <ClientesClientPage 
      initialClients={initialClients} 
      userId={session.user.id}
      teamId={teamId}
    />
  )
}

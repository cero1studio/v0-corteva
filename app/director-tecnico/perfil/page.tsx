import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { UserProfile } from "@/components/user-profile"

export default async function DirectorTecnicoPerfilPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Obtener el perfil del usuario actual
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      id, 
      full_name, 
      email,
      role,
      zone_id,
      zones(name),
      distributor_id,
      distributors(name)
    `)
    .eq("id", session?.user.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
        <p className="text-muted-foreground">Información de tu cuenta</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>Detalles de tu cuenta y asignaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <UserProfile profile={profile} />
        </CardContent>
      </Card>
    </div>
  )
}

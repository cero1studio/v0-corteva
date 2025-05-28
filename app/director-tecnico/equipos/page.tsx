import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TeamLevelBadge } from "@/components/team-level-badge"
import { GoalProgress } from "@/components/goal-progress"
import { getDistributorLogoUrl } from "@/lib/utils/image"
import Image from "next/image"

export default async function DirectorTecnicoEquiposPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Obtener el perfil del usuario actual
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, zone_id")
    .eq("id", session?.user.id)
    .single()

  // Obtener información de la zona
  const { data: zone } = await supabase.from("zones").select("id, name").eq("id", profile?.zone_id).single()

  // Obtener equipos de la zona
  const { data: teams } = await supabase
    .from("teams")
    .select(`
      id, 
      name, 
      total_points,
      logo_url,
      distributor_id,
      distributors(id, name, logo_url)
    `)
    .eq("zone_id", profile?.zone_id)
    .order("total_points", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Equipos de {zone?.name || "mi zona"}</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams && teams.length > 0 ? (
          teams.map((team) => (
            <Card key={team.id} className="overflow-hidden">
              <CardHeader className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-1">{team.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {team.distributors?.logo_url && (
                        <Image
                          src={getDistributorLogoUrl({
                            name: team.distributors?.name || "",
                            logo_url: team.distributors?.logo_url,
                          })}
                          alt={team.distributors?.name || "Distribuidor"}
                          width={24}
                          height={16}
                          className="object-contain"
                          unoptimized
                        />
                      )}
                      {team.distributors?.name || "Sin distribuidor"}
                    </CardDescription>
                  </div>
                  <TeamLevelBadge points={team.total_points || 0} />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-4">
                  <GoalProgress current={team.total_points || 0} goal={1000} label="Puntos totales" />
                  <Button asChild className="w-full">
                    <Link href={`/director-tecnico/equipos/${team.id}`}>Ver detalles</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center">
              <p className="mb-2 text-lg font-medium">No hay equipos en esta zona</p>
              <p className="text-muted-foreground">Cuando se creen equipos en esta zona, aparecerán aquí.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { TeamLevelBadge } from "@/components/team-level-badge"

export default async function DirectorTecnicoRankingPage() {
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

  // Obtener equipos de la zona ordenados por puntos
  const { data: teams } = await supabase
    .from("teams")
    .select(`
      id, 
      name, 
      total_points,
      logo_url,
      distributor_id,
      distributors(name)
    `)
    .eq("zone_id", profile?.zone_id)
    .order("total_points", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ranking de {zone?.name || "mi zona"}</h2>
        <p className="text-muted-foreground">Clasificación de equipos por puntos en tu zona</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabla de Posiciones</CardTitle>
          <CardDescription>Equipos ordenados por puntos totales</CardDescription>
        </CardHeader>
        <CardContent>
          {teams && teams.length > 0 ? (
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distribuidor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puntos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nivel
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teams.map((team, index) => (
                    <tr key={team.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 font-bold">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          {team.logo_url ? (
                            <img
                              src={team.logo_url || "/placeholder.svg"}
                              alt={team.name}
                              className="w-8 h-8 mr-3 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 mr-3 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              {team.name.charAt(0)}
                            </div>
                          )}
                          {team.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {team.distributors?.name || "Sin distribuidor"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                        {team.total_points || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <TeamLevelBadge points={team.total_points || 0} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No hay equipos en esta zona.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export default async function DirectorTecnicoReportesPage() {
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
  const { data: teams } = await supabase.from("teams").select("id, name").eq("zone_id", profile?.zone_id).order("name")

  // Obtener ventas de los equipos de la zona
  const { data: sales } = await supabase
    .from("sales")
    .select(`
      id,
      quantity,
      points,
      created_at,
      team_id,
      teams(name),
      product_id,
      products(name)
    `)
    .in("team_id", teams?.map((team) => team.id) || [])
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reportes de {zone?.name || "mi zona"}</h2>
        <p className="text-muted-foreground">Visualiza las estadísticas y ventas de los equipos en tu zona</p>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="teams">Equipos</TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Últimas ventas</CardTitle>
              <CardDescription>Ventas recientes de los equipos en tu zona</CardDescription>
            </CardHeader>
            <CardContent>
              {sales && sales.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Equipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Puntos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sales.map((sale) => (
                          <tr key={sale.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {sale.teams?.name || "Desconocido"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {sale.products?.name || "Desconocido"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.points}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(sale.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p>No hay ventas registradas para los equipos de esta zona.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipos en {zone?.name || "tu zona"}</CardTitle>
              <CardDescription>Lista de equipos</CardDescription>
            </CardHeader>
            <CardContent>
              {teams && teams.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nombre
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teams.map((team) => (
                          <tr key={team.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {team.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p>No hay equipos en esta zona.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

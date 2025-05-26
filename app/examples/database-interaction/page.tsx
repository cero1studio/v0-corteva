"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { getZones, getTeams, getProducts, getUsers } from "./actions"
import { Loader2 } from "lucide-react"

export default function DatabaseExamplePage() {
  const [activeTab, setActiveTab] = useState("zones")
  const [zones, setZones] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData(activeTab)
  }, [activeTab])

  async function loadData(tab: string) {
    setLoading(true)
    try {
      switch (tab) {
        case "zones":
          const zonesResult = await getZones()
          if (zonesResult.data) setZones(zonesResult.data)
          break
        case "teams":
          const teamsResult = await getTeams()
          if (teamsResult.data) setTeams(teamsResult.data)
          break
        case "products":
          const productsResult = await getProducts()
          if (productsResult.data) setProducts(productsResult.data)
          break
        case "users":
          const usersResult = await getUsers()
          if (usersResult.data) setUsers(usersResult.data)
          break
      }
    } catch (error) {
      console.error(`Error loading ${tab}:`, error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Ejemplo de Interacción con Base de Datos</h1>

      <Tabs defaultValue="zones" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="zones">Zonas</TabsTrigger>
          <TabsTrigger value="teams">Equipos</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === "zones" && "Zonas"}
              {activeTab === "teams" && "Equipos"}
              {activeTab === "products" && "Productos"}
              {activeTab === "users" && "Usuarios"}
            </CardTitle>
            <CardDescription>Datos obtenidos directamente de la base de datos Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-corteva-600" />
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      {activeTab === "zones" && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                      )}
                      {activeTab === "teams" && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Zona
                        </th>
                      )}
                      {activeTab === "products" && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puntos
                        </th>
                      )}
                      {activeTab === "users" && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeTab === "zones" &&
                      zones.map((zone) => (
                        <tr key={zone.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {zone.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{zone.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{zone.description}</td>
                        </tr>
                      ))}
                    {activeTab === "teams" &&
                      teams.map((team) => (
                        <tr key={team.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {team.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {team.zone_name || "Sin zona"}
                          </td>
                        </tr>
                      ))}
                    {activeTab === "products" &&
                      products.map((product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.points}</td>
                        </tr>
                      ))}
                    {activeTab === "users" &&
                      users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.full_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                        </tr>
                      ))}
                    {((activeTab === "zones" && zones.length === 0) ||
                      (activeTab === "teams" && teams.length === 0) ||
                      (activeTab === "products" && products.length === 0) ||
                      (activeTab === "users" && users.length === 0)) && (
                      <tr>
                        <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500">
                          No hay datos disponibles
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Button onClick={() => loadData(activeTab)} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  "Actualizar datos"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}

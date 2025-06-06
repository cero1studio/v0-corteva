"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Users, Plus, Calendar, User, Building2 } from "lucide-react"
import { getCompetitorClientsByTeam } from "@/app/actions/clients"
import { toast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/empty-state"
import Link from "next/link"

interface Client {
  id: string
  client_name: string
  created_at: string
}

export default function ClientesPage() {
  const { user, profile, isLoading: authLoading } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Solo ejecutar cuando auth no esté cargando y tengamos el profile con team_id
    if (!authLoading && profile?.team_id) {
      console.log("Loading clients for team:", profile.team_id)
      loadClients(profile.team_id)
    } else if (!authLoading && !profile?.team_id) {
      // Si no hay team_id, detener el loading
      console.log("No team_id available, stopping loading")
      setLoading(false)
    }
  }, [authLoading, profile?.team_id])

  const loadClients = async (teamId: string) => {
    try {
      setLoading(true)
      console.log("Calling getCompetitorClientsByTeam with:", teamId)

      const result = await getCompetitorClientsByTeam(teamId)

      console.log("Result from getCompetitorClientsByTeam:", result)

      if (result.success) {
        setClients(result.data || [])
        console.log("Clients loaded successfully:", result.data?.length || 0)
      } else {
        console.error("Error loading clients:", result.error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los clientes",
          variant: "destructive",
        })
        setClients([])
      }
    } catch (error) {
      console.error("Error loading clients:", error)
      toast({
        title: "Error",
        description: "Error al cargar los clientes",
        variant: "destructive",
      })
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter((client) =>
    client.client_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Mostrar loading solo si auth está cargando O si estamos cargando clientes
  if (authLoading || (loading && profile?.team_id)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-500 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">
                {authLoading ? "Cargando usuario..." : "Cargando clientes..."}
              </p>
              <p className="mt-1 text-sm text-gray-400">Team ID: {profile?.team_id || "No disponible"}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Debug Info - Solo en desarrollo */}
        {process.env.NODE_ENV === "development" && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <p className="text-sm text-yellow-800">
                <strong>Debug:</strong> Auth Loading: {authLoading ? "true" : "false"} | User ID:{" "}
                {user?.id || "No disponible"} | Profile Team ID: {profile?.team_id || "No disponible"} | Clientes:{" "}
                {clients.length}
              </p>
              {profile?.team_id && (
                <Button
                  onClick={() => loadClients(profile.team_id!)}
                  size="sm"
                  className="mt-2 bg-yellow-600 hover:bg-yellow-700"
                >
                  Recargar Clientes
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-corteva-100 rounded-xl">
                  <Users className="h-8 w-8 text-corteva-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Clientes Captados</h1>
                  <p className="text-gray-600">Gestiona los clientes de la competencia que has registrado</p>
                </div>
              </div>
            </div>
            <Button asChild size="lg" className="bg-corteva-600 hover:bg-corteva-700 text-white shadow-lg">
              <Link href="/capitan/registrar-cliente" className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Registrar Cliente
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Clientes</p>
                  <p className="text-2xl font-bold text-blue-900">{clients.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700">Este Mes</p>
                  <p className="text-2xl font-bold text-green-900">
                    {clients.filter((c) => new Date(c.created_at).getMonth() === new Date().getMonth()).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-700">Puntos Ganados</p>
                  <p className="text-2xl font-bold text-purple-900">{clients.length * 200}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-corteva-600" />
              Buscar Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre de cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base border-gray-300 focus:border-corteva-500 focus:ring-corteva-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredClients.length} cliente{filteredClients.length !== 1 ? "s" : ""} encontrado
              {filteredClients.length !== 1 ? "s" : ""}
            </h2>
            {searchTerm && (
              <Button variant="ghost" onClick={() => setSearchTerm("")} className="text-gray-500 hover:text-gray-700">
                Limpiar filtros
              </Button>
            )}
          </div>

          {filteredClients.length === 0 ? (
            <Card className="shadow-sm border-gray-200">
              <CardContent className="py-16">
                <EmptyState
                  icon={<Users className="h-16 w-16 text-gray-400" />}
                  title="No hay clientes"
                  description={
                    searchTerm
                      ? "No se encontraron clientes con los filtros aplicados"
                      : profile?.team_id
                        ? "Aún no hay clientes registrados por tu equipo"
                        : "No tienes un equipo asignado. Contacta al administrador."
                  }
                  action={
                    profile?.team_id ? (
                      <Button asChild className="bg-corteva-600 hover:bg-corteva-700">
                        <Link href="/capitan/registrar-cliente" className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Registrar Primer Cliente
                        </Link>
                      </Button>
                    ) : null
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <Card
                  key={client.id}
                  className="shadow-sm border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-corteva-100 rounded-lg">
                          <User className="h-5 w-5 text-corteva-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-1">
                            {client.client_name}
                          </CardTitle>
                          <p className="text-sm text-gray-500">Cliente captado</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                        +200 pts
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-1.5 bg-orange-100 rounded-md">
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha de registro</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(client.created_at).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

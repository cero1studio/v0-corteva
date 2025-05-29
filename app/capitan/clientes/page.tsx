"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, User, MapPin, Building } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export default function ClientesPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      setLoading(true)

      // Obtener el usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      // Cargar clientes del representante
      const { data, error } = await supabase
        .from("competitor_clients")
        .select(`
          *,
          profiles:representative_id(full_name)
        `)
        .eq("representative_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setClients(data || [])
    } catch (error: any) {
      console.error("Error al cargar clientes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar clientes según el término de búsqueda
  const filteredClients = clients.filter((client) => {
    if (!searchTerm) return true

    // Usar el operador de encadenamiento opcional para evitar errores
    const matchesSearch =
      (client.ganadero_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.producto_anterior || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.ubicacion_finca || "").toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold">Clientes Registrados</h1>
        <Button asChild>
          <Link href="/capitan/registrar-cliente">
            <Plus className="mr-2 h-4 w-4" /> Registrar Cliente
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Clientes</CardTitle>
          <CardDescription>Busca por nombre, ubicación o producto anterior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar clientes..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Clientes de la competencia registrados ({filteredClients.length} de {clients.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-600"></div>
            </div>
          ) : clients.length === 0 ? (
            <EmptyState
              icon="user"
              title="No hay clientes registrados"
              description="Registra tu primer cliente para comenzar a acumular puntos adicionales"
            >
              <Button asChild>
                <Link href="/capitan/registrar-cliente">Registrar Cliente</Link>
              </Button>
            </EmptyState>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ganadero</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Producto Anterior</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Puntos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {client.ganadero_name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {client.ubicacion_finca || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {client.producto_anterior || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                          +200 puntos
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Package, Search, Calendar, MoreHorizontal, Filter, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"

interface Sale {
  id: string
  quantity: number
  points: number
  sale_date: string
  created_at: string
  representative_id: string
  product_id: string
  products: {
    id: string
    name: string
    points: number
    image_url?: string
  }
  user_profile?: {
    id: string
    full_name: string
    team_id: string
    team?: {
      name: string
    }
  }
}

interface Product {
  id: string
  name: string
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<string>("all")
  const [sortBy, setSortBy] = useState("date-desc")
  const { toast } = useToast()
  const { session, user } = useAuth()

  useEffect(() => {
    if (session?.user && user) {
      loadVentas()
      loadProducts()
    }
  }, [session, user])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("id, name").order("name")

      if (error) {
        throw new Error(`Error al obtener productos: ${error.message}`)
      }

      setProducts(data || [])
    } catch (error: any) {
      console.error("Error al cargar productos:", error)
    }
  }

  const loadVentas = async () => {
    if (!session?.user || !user) {
      console.log("Usuario o perfil no disponible")
      return
    }

    try {
      setLoading(true)

      // Primero, obtenemos las ventas básicas
      let query = supabase.from("sales").select(`
          id,
          quantity,
          points,
          sale_date,
          created_at,
          representative_id,
          product_id
        `)

      // Si es capitán, obtener ventas de todo el equipo
      if (user.role === "capitan" && user.team_id) {
        // Obtener todos los miembros del equipo
        const { data: teamMembers, error: teamError } = await supabase
          .from("profiles")
          .select("id")
          .eq("team_id", user.team_id)

        if (teamError) {
          throw new Error(`Error al obtener miembros del equipo: ${teamError.message}`)
        }

        if (teamMembers && teamMembers.length > 0) {
          const memberIds = teamMembers.map((member) => member.id)
          query = query.in("representative_id", memberIds)
        }
      } else {
        // Si no es capitán, solo sus propias ventas
        query = query.eq("representative_id", session.user.id)
      }

      // Ordenar por fecha más reciente
      query = query.order("created_at", { ascending: false })

      const { data: salesData, error: salesError } = await query

      if (salesError) {
        throw new Error(`Error al obtener ventas: ${salesError.message}`)
      }

      if (!salesData || salesData.length === 0) {
        setVentas([])
        setLoading(false)
        return
      }

      // Obtener información de productos
      const productIds = [...new Set(salesData.map((sale) => sale.product_id))]
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, points, image_url")
        .in("id", productIds)

      if (productsError) {
        throw new Error(`Error al obtener productos: ${productsError.message}`)
      }

      // Obtener información de usuarios
      const userIds = [...new Set(salesData.map((sale) => sale.representative_id))]
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, full_name, team_id, teams:team_id (name)")
        .in("id", userIds)

      if (usersError) {
        throw new Error(`Error al obtener usuarios: ${usersError.message}`)
      }

      // Combinar los datos
      const ventasCompletas = salesData.map((sale) => {
        const product = productsData?.find((p) => p.id === sale.product_id)
        const userProfile = usersData?.find((u) => u.id === sale.representative_id)

        return {
          ...sale,
          products: product || { id: sale.product_id, name: "Producto desconocido", points: 0 },
          user_profile: userProfile || { id: sale.representative_id, full_name: "Usuario desconocido", team_id: "" },
        }
      })

      setVentas(ventasCompletas)
    } catch (error: any) {
      console.error("Error al cargar ventas:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las ventas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar ventas por término de búsqueda y producto seleccionado
  const filteredVentas = ventas.filter((venta) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      venta.products?.name?.toLowerCase().includes(searchLower) ||
      venta.user_profile?.full_name?.toLowerCase().includes(searchLower) ||
      String(venta.quantity).includes(searchLower) ||
      String(venta.points).includes(searchLower)

    const matchesProduct = selectedProduct === "all" || venta.product_id === selectedProduct

    return matchesSearch && matchesProduct
  })

  // Aplicar ordenamiento
  const sortedVentas = [...filteredVentas].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case "date-asc":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case "points-desc":
        return b.points - a.points
      case "points-asc":
        return a.points - b.points
      default:
        return 0
    }
  })

  // Calcular estadísticas
  const totalVentas = filteredVentas.length
  const totalPuntos = filteredVentas.reduce((sum, venta) => sum + venta.points, 0)
  const totalCantidad = filteredVentas.reduce((sum, venta) => sum + venta.quantity, 0)

  // Mostrar loading si no hay usuario o perfil
  if (!session?.user || !user) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ventas</h2>
          <p className="text-muted-foreground">
            {user.role === "capitan" ? `Ventas del equipo ${user.team_name || ""}` : "Tus ventas registradas"}
          </p>
        </div>
        <Button asChild>
          <Link href="/capitan/registrar-venta">
            <Plus className="mr-2 h-4 w-4" /> Registrar Venta
          </Link>
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVentas}</div>
            <p className="text-xs text-muted-foreground">ventas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Puntos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPuntos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">puntos generados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cantidad Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCantidad}</div>
            <p className="text-xs text-muted-foreground">unidades vendidas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Ventas</CardTitle>
          <CardDescription>
            {user.role === "capitan"
              ? "Visualiza todas las ventas registradas por tu equipo"
              : "Visualiza todas tus ventas registradas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por producto o vendedor..."
                className="max-w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por producto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los productos</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Más recientes primero</SelectItem>
                  <SelectItem value="date-asc">Más antiguos primero</SelectItem>
                  <SelectItem value="points-desc">Mayor puntaje primero</SelectItem>
                  <SelectItem value="points-asc">Menor puntaje primero</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
            </div>
          ) : sortedVentas.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Puntos</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVentas.map((venta) => (
                    <TableRow key={venta.id}>
                      <TableCell>
                        <span className="font-medium">{venta.products?.name || "Producto"}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{venta.user_profile?.full_name || "Usuario"}</div>
                          {user.role === "capitan" && (
                            <div className="text-sm text-muted-foreground">{venta.user_profile?.team?.name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{venta.quantity}</TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">{venta.points}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {venta.sale_date
                            ? format(new Date(venta.sale_date), "dd MMM yyyy", { locale: es })
                            : format(new Date(venta.created_at), "dd MMM yyyy", { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon="package"
              title="No hay ventas registradas"
              description={
                searchTerm || selectedProduct !== "all"
                  ? "No se encontraron ventas que coincidan con los filtros aplicados."
                  : "Aún no se han registrado ventas."
              }
            >
              {searchTerm || selectedProduct !== "all" ? (
                <Button
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedProduct("all")
                  }}
                  size="sm"
                >
                  Limpiar filtros
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link href="/capitan/registrar-venta">
                    <Plus className="mr-2 h-4 w-4" /> Registrar Venta
                  </Link>
                </Button>
              )}
            </EmptyState>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

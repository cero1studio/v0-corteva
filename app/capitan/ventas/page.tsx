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
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"
import { getCapitanVentasForSession, getProductosParaFiltroVentas } from "@/app/actions/captain-ventas"

interface Sale {
  id: string
  quantity: number
  points: number
  sale_date: string | null
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

function formatVentasLoadError(message: string): string {
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(message)) {
    return "No se pudo conectar con el servidor. Revisa tu conexión, VPN, firewall o extensiones que bloqueen peticiones. Si el problema continúa, contacta al administrador."
  }
  return message
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  /** Solo el fetch de ventas; en false al inicio para no quedar en spinner mientras carga NextAuth */
  const [ventasLoading, setVentasLoading] = useState(false)
  const [ventasError, setVentasError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<string>("all")
  const [sortBy, setSortBy] = useState("date-desc")
  const { toast } = useToast()
  const { session, user, profile, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return

    if (!session?.user || !user) {
      setVentas([])
      return
    }

    void loadVentas()
    void loadProducts()
  }, [session, user, profile?.team_id, profile?.role, authLoading])

  const loadProducts = async () => {
    try {
      const result = await getProductosParaFiltroVentas()
      if (result.success) {
        setProducts(result.data)
      } else {
        console.error("Error al cargar productos:", result.error)
      }
    } catch (error: any) {
      console.error("Error al cargar productos:", error)
    }
  }

  const loadVentas = async () => {
    if (!session?.user || !user) {
      return
    }

    try {
      setVentasLoading(true)
      setVentasError(null)

      const result = await getCapitanVentasForSession()
      if (!result.success) {
        throw new Error(result.error)
      }

      setVentas(result.data as Sale[])
    } catch (error: any) {
      console.error("Error al cargar ventas:", error)
      const raw = error?.message || String(error)
      const friendly = formatVentasLoadError(raw)
      setVentasError(friendly)
      setVentas([])
      toast({
        title: "No se pudieron cargar las ventas",
        description: friendly,
        variant: "destructive",
      })
    } finally {
      setVentasLoading(false)
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

  if (authLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-muted-foreground">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-corteva-600 border-t-transparent" />
        <p className="text-sm">Cargando sesión…</p>
      </div>
    )
  }

  if (!session?.user || !user) {
    return (
      <div className="flex-1 p-6">
        <EmptyState
          icon="package"
          title="No hay sesión activa"
          description="Inicia sesión para ver tus ventas."
        />
      </div>
    )
  }

  const isCapitan = profile?.role === "capitan"

  return (
    <div className="flex-1 space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ventas</h2>
          <p className="text-muted-foreground">
            {isCapitan
              ? `Ventas del equipo${profile?.team_name ? ` ${profile.team_name}` : ""}`
              : "Tus ventas registradas"}
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
            {isCapitan
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

          {ventasLoading ? (
            <div className="flex flex-col justify-center items-center min-h-[220px] gap-3 py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-corteva-600 border-t-transparent" />
              <p className="text-sm">Cargando ventas…</p>
            </div>
          ) : ventasError ? (
            <EmptyState
              icon="package"
              title="Error al cargar ventas"
              description={ventasError}
            >
              <Button className="bg-corteva-600 hover:bg-corteva-700" onClick={() => void loadVentas()}>
                Reintentar
              </Button>
            </EmptyState>
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
                          {isCapitan && (
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
              title={
                searchTerm || selectedProduct !== "all"
                  ? "Sin resultados"
                  : "No hay ventas registradas"
              }
              description={
                searchTerm || selectedProduct !== "all"
                  ? "Prueba con otros términos o quita los filtros."
                  : isCapitan
                    ? "Cuando tu equipo registre ventas, aparecerán aquí. Puedes registrar la primera desde el botón de arriba."
                    : "Registra tu primera venta para empezar a sumar puntos."
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

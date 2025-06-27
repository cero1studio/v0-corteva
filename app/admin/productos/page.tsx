"use client"

import { useEffect, useState, useCallback } from "react"
import { Download, MoreHorizontal, Plus, Search, Package, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { getProducts, deleteProduct, toggleProductStatus } from "@/app/actions/products"
import Image from "next/image"
import { useCachedList } from "@/lib/global-cache"

// Definir la interfaz para los productos
interface Product {
  id: string
  name: string
  description?: string
  points: number
  active?: boolean
  image_url?: string
}

export default function ProductosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const fetchProducts = useCallback(async () => {
    const result = await getProducts()
    if (result.success && Array.isArray(result.data)) {
      return result.data
    } else {
      throw new Error(result.error || "Error al cargar productos")
    }
  }, [])

  const { data: products, loading, error: cacheError, refresh } = useCachedList("admin-products", fetchProducts, [])

  useEffect(() => {
    if (cacheError) {
      setError("Error al cargar productos. Por favor, intenta de nuevo.")
    }
  }, [cacheError])

  // Asegurarse de que products es un array antes de usar filter
  const filteredProducts = Array.isArray(products)
    ? products.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : []

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      try {
        const result = await deleteProduct(productId)
        if (result.success) {
          toast({
            title: "Producto eliminado",
            description: "El producto ha sido eliminado exitosamente",
          })
          // Actualizar la lista de productos
          refresh()
        } else {
          toast({
            title: "Error",
            description: result.error || "Ha ocurrido un error al eliminar el producto",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error(error)
        toast({
          title: "Error",
          description: "Ha ocurrido un error al eliminar el producto",
          variant: "destructive",
        })
      }
    }
  }

  const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const result = await toggleProductStatus(productId, !currentStatus)
      if (result.success) {
        toast({
          title: "Estado actualizado",
          description: `El producto ha sido ${!currentStatus ? "activado" : "desactivado"} exitosamente`,
        })
        // Actualizar la lista de productos
        refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Ha ocurrido un error al cambiar el estado del producto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Ha ocurrido un error al cambiar el estado del producto",
        variant: "destructive",
      })
    }
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Productos</h1>
          <p className="text-muted-foreground">Administra los productos y puntos de la competición.</p>
        </div>
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Error al cargar productos</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Productos</h1>
          <p className="text-muted-foreground">Administra los productos y puntos de la competición.</p>
        </div>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-500"></div>
        </div>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Productos</h1>
          <p className="text-muted-foreground">Administra los productos y puntos de la competición.</p>
        </div>
        <EmptyState
          icon="package"
          title="No hay productos registrados"
          description="Aún no hay productos registrados en el sistema. Crea tu primer producto para comenzar."
          actionLabel="Crear Producto"
          actionHref="/admin/productos/nuevo"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Productos</h1>
        <p className="text-muted-foreground">Administra los productos y puntos de la competición.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Productos</CardTitle>
            <CardDescription>Productos registrados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
            <CardDescription>Productos disponibles para venta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter((p) => p.active).length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              className="w-full sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline-block">Exportar</span>
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1 bg-corteva-500 hover:bg-corteva-600"
              onClick={() => router.push("/admin/productos/nuevo")}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline-block">Nuevo Producto</span>
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-center">Puntos</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No se encontraron productos con ese criterio de búsqueda.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.id.substring(0, 8)}</TableCell>
                    <TableCell>
                      <div className="relative h-16 w-16 overflow-hidden rounded-md flex items-center justify-center bg-white">
                        {product.image_url ? (
                          <Image
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="object-contain"
                            style={{ maxWidth: "100%", maxHeight: "100%" }}
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center bg-muted">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Badge variant="outline" className="bg-corteva-50 text-corteva-500 border-corteva-200">
                          {product.points}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Badge
                          variant={product.active ? "default" : "secondary"}
                          className={product.active ? "bg-corteva-500 cursor-pointer" : "cursor-pointer"}
                          onClick={() => handleToggleStatus(product.id, !!product.active)}
                        >
                          {product.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/admin/productos/editar/${product.id}`)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)}>Eliminar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(product.id, !!product.active)}>
                            {product.active ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

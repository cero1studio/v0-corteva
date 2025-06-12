"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Package, Download } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getImageUrl } from "@/lib/utils/image"
import { getAllSales, createSale, updateSale, deleteSale } from "@/app/actions/sales"
import { getAllZones } from "@/app/actions/zones"
import { getAllTeams } from "@/app/actions/teams"
import { getAllProducts } from "@/app/actions/products"
import { getAllUsers } from "@/app/actions/users"
import { getAllDistributors } from "@/app/actions/distributors"
import * as XLSX from "xlsx" // Importar la librería XLSX

interface Sale {
  id: string
  quantity: number
  points: number
  price: number
  sale_date: string
  created_at: string
  products: {
    id: string
    name: string
    image_url?: string
  } | null
  representative: {
    id: string
    full_name: string
    team_id: string
    distributor_id: string
  } | null
  team: {
    id: string
    name: string
    zone_id: string
  } | null
  zone: {
    id: string
    name: string
  } | null
  distributor: {
    id: string
    name: string
  } | null
}

interface Zone {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
  zone_id: string
}

interface Product {
  id: string
  name: string
  price: number
}

interface User {
  id: string
  full_name: string
  team_id: string
  role?: string
}

interface Distributor {
  id: string
  name: string
}

export default function AdminVentasPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedZone, setSelectedZone] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    points: "",
    representative_id: "",
  })

  const [selectedProductPoints, setSelectedProductPoints] = useState<number>(0)

  useEffect(() => {
    if (formData.product_id && formData.quantity) {
      const selectedProduct = products.find((p) => p.id === formData.product_id)
      if (selectedProduct) {
        const calculatedPoints = selectedProduct.price * Number.parseInt(formData.quantity)
        setSelectedProductPoints(selectedProduct.price)
        setFormData((prev) => ({ ...prev, points: calculatedPoints.toString() }))
      }
    } else {
      // Si no hay producto o cantidad, limpiar los puntos
      setFormData((prev) => ({ ...prev, points: "" }))
      setSelectedProductPoints(0)
    }
  }, [formData.product_id, formData.quantity, products])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const [salesResult, zonesData, teamsResult, productsResult, usersResult, distributorsData] = await Promise.all([
        getAllSales(),
        getAllZones(),
        getAllTeams(),
        getAllProducts(),
        getAllUsers(),
        getAllDistributors(),
      ])

      if (salesResult.success) {
        setSales(salesResult.data || [])
      } else {
        console.error("Error loading sales:", salesResult.error)
        toast({
          title: "Error",
          description: "Error al cargar las ventas",
          variant: "destructive",
        })
      }

      if (zonesData && Array.isArray(zonesData)) {
        setZones(zonesData)
      } else {
        setZones([])
      }

      if (teamsResult.success) {
        setTeams(teamsResult.data || [])
      } else {
        setTeams([])
      }

      if (productsResult.success) {
        setProducts(productsResult.data || [])
      } else {
        setProducts([])
      }

      if (usersResult.data) {
        setUsers(usersResult.data || [])
      } else {
        setUsers([])
      }

      if (distributorsData && Array.isArray(distributorsData)) {
        setDistributors(distributorsData)
      } else {
        setDistributors([])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter((sale) => {
    const productName = sale.products?.name || ""
    const teamName = sale.team?.name || ""
    const zoneName = sale.zone?.name || ""
    const distributorName = sale.distributor?.name || ""
    const captainName = sale.representative?.full_name || ""

    const matchesSearch =
      productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zoneName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      distributorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      captainName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesZone = selectedZone === "all" || sale.zone?.id === selectedZone

    return matchesSearch && matchesZone
  })

  const downloadExcel = () => {
    try {
      if (filteredSales.length === 0) {
        toast({
          title: "Error",
          description: "No hay datos para exportar",
          variant: "destructive",
        })
        return
      }

      // Preparar datos para Excel
      const excelData = filteredSales.map((sale) => ({
        Producto: sale.products?.name || "N/A",
        Capitán: sale.representative?.full_name || "N/A",
        Distribuidor: sale.distributor?.name || "N/A",
        Equipo: sale.team?.name || "N/A",
        Zona: sale.zone?.name || "N/A",
        Cantidad: sale.quantity,
        Puntos: sale.points,
        "Fecha de Venta": sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : "N/A",
        "Fecha de Registro": new Date(sale.created_at).toLocaleDateString(),
      }))

      // Crear workbook y worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Configurar anchos de columna
      const colWidths = [
        { wch: 25 }, // Producto
        { wch: 20 }, // Capitán
        { wch: 20 }, // Distribuidor
        { wch: 20 }, // Equipo
        { wch: 15 }, // Zona
        { wch: 10 }, // Cantidad
        { wch: 10 }, // Puntos
        { wch: 15 }, // Fecha de Venta
        { wch: 18 }, // Fecha de Registro
      ]
      ws["!cols"] = colWidths

      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, "Ventas")

      // Generar archivo en formato binario
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })

      // Convertir a Blob
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      // Crear URL para el blob
      const url = URL.createObjectURL(blob)

      // Crear elemento de enlace para descargar
      const a = document.createElement("a")
      a.href = url
      a.download = `ventas_${new Date().toISOString().split("T")[0]}.xlsx`

      // Simular clic para iniciar descarga
      document.body.appendChild(a)
      a.click()

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)

      toast({
        title: "Éxito",
        description: "Archivo Excel descargado correctamente",
      })
    } catch (error) {
      console.error("Error downloading Excel:", error)
      toast({
        title: "Error",
        description: "Error al descargar el archivo Excel",
        variant: "destructive",
      })
    }
  }

  const handleCreateSale = async () => {
    try {
      if (!formData.product_id || !formData.quantity || !formData.representative_id) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        })
        return
      }

      // Calcular puntos si no están calculados
      let finalPoints = formData.points
      if (!finalPoints || finalPoints === "0") {
        const selectedProduct = products.find((p) => p.id === formData.product_id)
        if (selectedProduct && formData.quantity) {
          finalPoints = (selectedProduct.price * Number.parseInt(formData.quantity)).toString()
        }
      }

      if (!finalPoints || finalPoints === "0") {
        toast({
          title: "Error",
          description: "No se pudieron calcular los puntos",
          variant: "destructive",
        })
        return
      }

      const form = new FormData()
      form.append("product_id", formData.product_id)
      form.append("quantity", formData.quantity)
      form.append("points", finalPoints)
      form.append("representative_id", formData.representative_id)

      const result = await createSale(form)

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Venta creada correctamente",
        })
        setIsCreateDialogOpen(false)
        setFormData({ product_id: "", quantity: "", points: "", representative_id: "" })
        setSelectedProductPoints(0)
        loadData()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al crear la venta",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating sale:", error)
      toast({
        title: "Error",
        description: "Error al crear la venta",
        variant: "destructive",
      })
    }
  }

  const handleEditSale = async () => {
    try {
      if (
        !editingSale ||
        !formData.product_id ||
        !formData.quantity ||
        !formData.points ||
        !formData.representative_id
      ) {
        toast({
          title: "Error",
          description: "Todos los campos son obligatorios",
          variant: "destructive",
        })
        return
      }

      const form = new FormData()
      form.append("product_id", formData.product_id)
      form.append("quantity", formData.quantity)
      form.append("points", formData.points)
      form.append("representative_id", formData.representative_id)

      const result = await updateSale(editingSale.id, form)

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Venta actualizada correctamente",
        })
        setIsEditDialogOpen(false)
        setEditingSale(null)
        loadData()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar la venta",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating sale:", error)
      toast({
        title: "Error",
        description: "Error al actualizar la venta",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSale = async (saleId: string) => {
    try {
      const result = await deleteSale(saleId)

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Venta eliminada correctamente",
        })
        loadData()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al eliminar la venta",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting sale:", error)
      toast({
        title: "Error",
        description: "Error al eliminar la venta",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (sale: Sale) => {
    setEditingSale(sale)
    const product = products.find((p) => p.id === sale.products?.id)
    if (product) {
      setSelectedProductPoints(product.price)
    }
    setFormData({
      product_id: sale.products?.id || "",
      quantity: sale.quantity.toString(),
      points: sale.points.toString(),
      representative_id: sale.representative?.id || "",
    })
    setIsEditDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-500 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando ventas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Ventas</h1>
          <p className="text-muted-foreground">Administra todas las ventas del sistema por zonas y equipos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadExcel} disabled={filteredSales.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Descargar Excel
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Venta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Venta</DialogTitle>
                <DialogDescription>Registra una nueva venta en el sistema</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="representative">Representante</Label>
                  <Select
                    value={formData.representative_id}
                    onValueChange={(value) => setFormData({ ...formData, representative_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar representante" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="product">Producto</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Cantidad vendida"
                  />
                </div>
                <div>
                  <Label htmlFor="points">Puntos Totales</Label>
                  <Input
                    id="points"
                    type="number"
                    step="0.01"
                    value={formData.points}
                    readOnly
                    className="bg-gray-50 font-medium"
                    placeholder="Selecciona producto y cantidad"
                  />
                  {selectedProductPoints > 0 && formData.quantity && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedProductPoints} puntos × {formData.quantity} = {formData.points} puntos totales
                    </p>
                  )}
                </div>
                <Button onClick={handleCreateSale} className="w-full">
                  Crear Venta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por producto, equipo, capitán..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="zone">Zona</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las zonas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las zonas</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedZone("all")
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas Registradas</CardTitle>
          <CardDescription>
            {filteredSales.length} venta{filteredSales.length !== 1 ? "s" : ""} encontrada
            {filteredSales.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay ventas</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedZone !== "all"
                  ? "No se encontraron ventas con los filtros aplicados"
                  : "Aún no hay ventas registradas"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Capitán</TableHead>
                  <TableHead>Distribuidor</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Puntos</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(sale.products?.image_url) || "/placeholder.svg?height=40&width=40"}
                          alt={sale.products?.name || "Producto"}
                          className="h-10 w-10 rounded-md object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=40&width=40"
                          }}
                        />
                        <span className="font-medium">{sale.products?.name || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50">
                        {sale.representative?.full_name || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50">
                        {sale.distributor?.name || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sale.team?.name || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{sale.zone?.name || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>{sale.points?.toLocaleString() || "0"}</TableCell>
                    <TableCell>{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : "N/A"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(sale)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteSale(sale.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Venta</DialogTitle>
            <DialogDescription>Modifica los datos de la venta</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-representative">Representante</Label>
              <Select
                value={formData.representative_id}
                onValueChange={(value) => setFormData({ ...formData, representative_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar representante" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-product">Producto</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-quantity">Cantidad</Label>
              <Input
                id="edit-quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Cantidad vendida"
              />
            </div>
            <div>
              <Label htmlFor="edit-points">Puntos (Calculado automáticamente)</Label>
              <Input
                id="edit-points"
                type="number"
                step="0.01"
                value={formData.points}
                readOnly
                className="bg-gray-50"
                placeholder="Se calculará automáticamente"
              />
              {selectedProductPoints > 0 && formData.quantity && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedProductPoints} puntos × {formData.quantity} = {formData.points} puntos totales
                </p>
              )}
            </div>
            <Button onClick={handleEditSale} className="w-full">
              Actualizar Venta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

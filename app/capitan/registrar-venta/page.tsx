"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, ShoppingBag, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { GoalCelebration } from "@/components/goal-celebration"

// Constante para la conversión de puntos a goles
const PUNTOS_POR_GOL = 100

export default function RegistrarVentaPage() {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [date, setDate] = useState<Date>(new Date())
  const [userId, setUserId] = useState("")
  const [showCelebration, setShowCelebration] = useState(false)
  const [goalCount, setGoalCount] = useState(0)
  const [productName, setProductName] = useState("")
  const [totalPoints, setTotalPoints] = useState(0)
  const [puntosParaGol, setPuntosParaGol] = useState(PUNTOS_POR_GOL)
  const [selectedProductData, setSelectedProductData] = useState<any>(null)
  const [productImages, setProductImages] = useState<Record<string, string>>({})

  const router = useRouter()
  const { toast } = useToast()

  // Función para obtener la URL de la imagen de un producto
  const getProductImageUrl = async (productId: string) => {
    try {
      const { data: files } = await supabase.storage.from("product-images").list("", {
        search: `${productId}`,
      })

      if (files && files.length > 0) {
        const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(files[0].name)
        return publicUrlData.publicUrl
      }
    } catch (error) {
      console.error(`Error getting image for product ${productId}:`, error)
    }
    return null
  }

  useEffect(() => {
    async function fetchData() {
      try {
        // Obtener usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
        }

        // Obtener configuración del sistema
        const { data: configData, error: configError } = await supabase
          .from("system_config")
          .select("*")
          .eq("key", "puntos_para_gol")
          .single()

        if (!configError && configData) {
          setPuntosParaGol(Number(configData.value) || PUNTOS_POR_GOL)
        }

        // Obtener productos
        const { data: productsData, error: productsError } = await supabase.from("products").select("*").order("name")

        if (productsError) throw productsError

        // Obtener imágenes para cada producto
        const images: Record<string, string> = {}
        for (const product of productsData || []) {
          const imageUrl = await getProductImageUrl(product.id)
          if (imageUrl) {
            images[product.id] = imageUrl
          }
        }

        setProductImages(images)
        setProducts(productsData || [])
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos necesarios",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [toast])

  // Actualizar el producto seleccionado cuando cambia la selección
  useEffect(() => {
    if (selectedProduct && products.length > 0) {
      const product = products.find((p) => p.id === selectedProduct)
      setSelectedProductData(product || null)
    } else {
      setSelectedProductData(null)
    }
  }, [selectedProduct, products])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProduct || quantity < 1 || !userId) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Obtener información del producto
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("points, name")
        .eq("id", selectedProduct)
        .single()

      if (productError) throw new Error(`Error al obtener producto: ${productError.message}`)
      if (!product) throw new Error("Producto no encontrado")

      // Calcular totales
      const calculatedTotalPoints = product.points * quantity

      // Registrar la venta
      const { data, error } = await supabase
        .from("sales")
        .insert({
          user_id: userId,
          product_id: selectedProduct,
          quantity,
          points: calculatedTotalPoints,
          sale_date: format(date, "yyyy-MM-dd"),
        })
        .select()

      if (error) throw new Error(`Error al registrar venta: ${error.message}`)

      // Calcular goles
      const golesCompletos = Math.floor(calculatedTotalPoints / puntosParaGol)

      // Mostrar celebración
      setGoalCount(golesCompletos)
      setProductName(product.name)
      setTotalPoints(calculatedTotalPoints)
      setShowCelebration(true)

      // Limpiar formulario
      setSelectedProduct("")
      setQuantity(1)
      setDate(new Date())
    } catch (error: any) {
      console.error("Error al registrar venta:", error)
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCelebrationClose = () => {
    setShowCelebration(false)
    toast({
      title: "Venta registrada",
      description: "La venta ha sido registrada correctamente",
    })
    router.push("/capitan/dashboard")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center">
        <Button variant="outline" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Registrar Venta</h1>
      </div>

      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Nueva Venta
          </CardTitle>
          <CardDescription>Registra una nueva venta de productos</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Producto</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        {productImages[product.id] && (
                          <div className="h-6 w-6 rounded-md border bg-white flex items-center justify-center overflow-hidden">
                            <img
                              src={productImages[product.id] || "/placeholder.svg"}
                              alt={product.name}
                              className="h-5 w-5 object-contain"
                            />
                          </div>
                        )}
                        <span>
                          {product.name} ({product.points} puntos)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProductData && (
              <div className="rounded-md border p-3 bg-gray-50">
                <div className="flex items-center gap-3">
                  {productImages[selectedProductData.id] ? (
                    <div className="h-16 w-16 rounded-md border bg-white flex items-center justify-center overflow-hidden">
                      <img
                        src={productImages[selectedProductData.id] || "/placeholder.svg"}
                        alt={selectedProductData.name}
                        className="h-14 w-14 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-md border bg-gray-100 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{selectedProductData.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedProductData.points} puntos por unidad</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
              />
            </div>

            {selectedProductData && quantity > 0 && (
              <div className="rounded-md border p-3 bg-corteva-50">
                <div className="flex justify-between text-sm mb-1">
                  <span>Total puntos:</span>
                  <span className="font-medium">{selectedProductData.points * quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Goles completos:</span>
                  <span className="font-medium">
                    {Math.floor((selectedProductData.points * quantity) / puntosParaGol)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Puntos sobrantes:</span>
                  <span className="font-medium">{(selectedProductData.points * quantity) % puntosParaGol}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Fecha de Venta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" type="button">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Venta"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <GoalCelebration
        isOpen={showCelebration}
        onClose={handleCelebrationClose}
        goalCount={goalCount}
        productName={productName}
        totalPoints={totalPoints}
        pointsPerGoal={puntosParaGol}
      />
    </div>
  )
}

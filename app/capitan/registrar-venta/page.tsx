"use client"

import type React from "react"

import { contestGoalsFromPoints, contestPointsRemainder, parsePuntosParaGol, toContestPoints } from "@/lib/goals"
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
import { CalendarIcon, ShoppingBag, ArrowLeft, Plus, Minus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { getCapitanRegistroVentaData, registerCapitanVenta } from "@/app/actions/captain-ventas"
import { GoalCelebration } from "@/components/goal-celebration"
import Image from "next/image"

// Constante para la conversión de puntos a goles
const PUNTOS_POR_GOL = 100

export default function RegistrarVentaPage() {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [date, setDate] = useState<Date>(new Date())
  const [showCelebration, setShowCelebration] = useState(false)
  const [goalCount, setGoalCount] = useState(0)
  const [productName, setProductName] = useState("")
  const [totalPoints, setTotalPoints] = useState(0)
  const [puntosParaGol, setPuntosParaGol] = useState(PUNTOS_POR_GOL)
  const [selectedProductData, setSelectedProductData] = useState<any>(null)

  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status: sessionStatus } = useSession()

  // Función para obtener la URL de imagen del producto (igual que en admin)
  const getProductImageUrl = (product: any): string => {
    if (!product?.image_url) {
      return "/placeholder.svg"
    }

    // Si es una URL completa, devolverla tal como está
    if (product.image_url.startsWith("http")) {
      return product.image_url
    }

    // Si es una ruta local, devolverla tal como está
    if (product.image_url.startsWith("/")) {
      return product.image_url
    }

    // Si es una ruta de Supabase Storage, generar la URL pública
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      return `${supabaseUrl}/storage/v1/object/public/images/${product.image_url}`
    } catch (error) {
      console.error("Error al generar URL de imagen:", error)
      return "/placeholder.svg"
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getCapitanRegistroVentaData()
        if (!result.success) {
          throw new Error(result.error)
        }
        setPuntosParaGol(parsePuntosParaGol(result.puntosParaGol))
        setProducts(result.products || [])
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos necesarios",
          variant: "destructive",
        })
      }
    }

    void fetchData()
  }, [])

  // Actualizar el producto seleccionado cuando cambia la selección
  useEffect(() => {
    if (selectedProduct && products.length > 0) {
      const product = products.find((p) => p.id === selectedProduct)
      setSelectedProductData(product || null)
      console.log("Producto seleccionado:", product)
    } else {
      setSelectedProductData(null)
    }
  }, [selectedProduct, products])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProduct || quantity < 1 || sessionStatus !== "authenticated" || !session?.user?.id) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos o inicia sesión de nuevo",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const product = products.find((p) => p.id === selectedProduct)
      if (!product) throw new Error("Producto no encontrado")

      const calculatedTotalPoints = toContestPoints(product.points) * quantity
      if (!calculatedTotalPoints || calculatedTotalPoints <= 0) {
        throw new Error("Los puntos calculados no son válidos")
      }

      const reg = await registerCapitanVenta({
        productId: selectedProduct,
        quantity,
        saleDate: format(date, "yyyy-MM-dd"),
      })

      if (!reg.success) {
        throw new Error(reg.error)
      }

      const golesCompletos = contestGoalsFromPoints(calculatedTotalPoints, puntosParaGol)

      setGoalCount(golesCompletos)
      setProductName(product.name)
      setTotalPoints(calculatedTotalPoints)
      setShowCelebration(true)

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

    // Resetear todos los estados
    setSelectedProduct("")
    setQuantity(1)
    setDate(new Date())
    setSelectedProductData(null)
    setLoading(false) // Asegurar que loading esté en false

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
                        <div className="relative h-6 w-6 overflow-hidden rounded-md border">
                          <Image
                            src={getProductImageUrl(product) || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg"
                            }}
                          />
                        </div>
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
                  <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                    <Image
                      src={getProductImageUrl(selectedProductData) || "/placeholder.svg"}
                      alt={selectedProductData.name}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg"
                      }}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{selectedProductData.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedProductData.points} puntos por unidad</p>
                    {selectedProductData.description && (
                      <p className="text-xs text-muted-foreground mt-1">{selectedProductData.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="quantity"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={quantity}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "")
                    const numValue = value === "" ? 1 : Number.parseInt(value)
                    setQuantity(Math.max(1, numValue))
                  }}
                  onFocus={(e) => e.target.select()}
                  className="text-center text-lg font-medium h-10"
                  placeholder="1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedProductData && quantity > 0 && (() => {
              const salePts = toContestPoints(selectedProductData.points) * quantity
              return (
              <div className="rounded-md border p-3 bg-corteva-50">
                <div className="flex justify-between text-sm mb-1">
                  <span>Total puntos:</span>
                  <span className="font-medium">{salePts}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Goles completos:</span>
                  <span className="font-medium">
                    {contestGoalsFromPoints(salePts, puntosParaGol)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Puntos sobrantes:</span>
                  <span className="font-medium">{contestPointsRemainder(salePts, puntosParaGol)}</span>
                </div>
              </div>
              )
            })()}

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

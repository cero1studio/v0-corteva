"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegistrarVentaPage() {
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Registrar Venta</h1>

      <div className="space-y-4">
        {/* Product Selection (Placeholder) */}
        <div>
          <Label htmlFor="product">Producto</Label>
          <Input id="product" type="text" placeholder="Seleccionar producto" />
        </div>

        {/* Quantity Input */}
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

        {/* Price Input (Placeholder) */}
        <div>
          <Label htmlFor="price">Precio</Label>
          <Input id="price" type="number" placeholder="Precio" />
        </div>

        {/* Submit Button (Placeholder) */}
        <Button>Registrar Venta</Button>
      </div>
    </div>
  )
}

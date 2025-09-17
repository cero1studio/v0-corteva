"use client"

import { useEffect, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ShoppingBag } from "lucide-react"
import { EmptyState } from "./empty-state"

type ProductSalesData = {
  name: string
  value: number // Represents total quantity or total points/volume
  color: string
}

export function ReportProductsChart() {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ProductSalesData[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [productsResult, salesResult] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, price"), // Assuming 'price' can be used for volume/points
        supabase.from("sales").select("product_id, quantity, points"),
      ])

      if (productsResult.error) throw productsResult.error
      if (salesResult.error) throw salesResult.error

      const products = productsResult.data || []
      const sales = salesResult.data || []

      if (products.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      const productSalesMap = new Map<string, number>() // product_id -> total_volume/points

      sales.forEach((sale) => {
        const product = products.find((p) => p.id === sale.product_id)
        if (product) {
          // Use points if available, otherwise calculate from quantity and product price
          const value = sale.points || (product.price || 0) * (sale.quantity || 0)
          productSalesMap.set(product.id, (productSalesMap.get(product.id) || 0) + value)
        }
      })

      const colors = ["#4ade80", "#f59e0b", "#3b82f6", "#a855f7", "#ef4444", "#10b981", "#6366f1", "#f97316"]
      let colorIndex = 0

      const chartData: ProductSalesData[] = products
        .map((product) => {
          const totalValue = productSalesMap.get(product.id) || 0
          const color = colors[colorIndex % colors.length]
          colorIndex++
          return {
            name: product.name,
            value: totalValue,
            color: color,
          }
        })
        .filter((item) => item.value > 0) // Only show products with actual sales
        .sort((a, b) => b.value - a.value) // Sort by value descending

      setData(chartData)
    } catch (err: any) {
      console.error("Error al cargar datos del gráfico de productos:", err)
      setError(`Error al cargar datos: ${err.message || "Desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted) {
    return <div className="h-[300px] flex items-center justify-center">Cargando gráfico...</div>
  }

  if (loading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Error al cargar datos"
        description={error}
        actionLabel="Reintentar"
        onClick={fetchData}
        className="h-[300px]"
        iconClassName="bg-red-50"
      />
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="No hay datos de ventas por producto"
        description="Registra ventas para ver la distribución por producto."
        className="h-[300px]"
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={true}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          label={({ name, value, percent }) => `${name}: ${value.toLocaleString()} (${(percent * 100).toFixed(0)}%)`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value.toLocaleString()} puntos`, "Volumen/Puntos"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

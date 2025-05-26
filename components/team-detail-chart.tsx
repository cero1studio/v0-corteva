"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Sample data
const data = [
  { name: "Semana 1", goals: 65, sales: 32, clients: 4 },
  { name: "Semana 2", goals: 78, sales: 38, clients: 5 },
  { name: "Semana 3", goals: 95, sales: 45, clients: 6 },
  { name: "Semana 4", goals: 86, sales: 41, clients: 5 },
  { name: "Semana 5", goals: 105, sales: 52, clients: 7 },
  { name: "Semana 6", goals: 92, sales: 45, clients: 6 },
  { name: "Semana 7", goals: 110, sales: 54, clients: 8 },
]

export function TeamDetailChart() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="h-[300px] flex items-center justify-center">Cargando gráfico...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="goals" name="Goles" stroke="#f59e0b" strokeWidth={2} />
        <Line type="monotone" dataKey="sales" name="Ventas" stroke="#4ade80" strokeWidth={2} />
        <Line type="monotone" dataKey="clients" name="Clientes" stroke="#3b82f6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

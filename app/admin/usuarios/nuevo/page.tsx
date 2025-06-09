"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff } from "lucide-react"

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Usuario creado exitosamente",
        })
        router.push("/admin/usuarios")
      } else {
        const errorData = await response.json()
        toast({
          variant: "destructive",
          title: "Error al crear usuario",
          description: errorData.message || "Ocurrió un error inesperado.",
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al crear usuario",
        description: error.message || "Ocurrió un error inesperado.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Crear Nuevo Usuario</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
            </button>
          </div>
        </div>
        <Button disabled={loading} type="submit">
          {loading ? "Creando..." : "Crear Usuario"}
        </Button>
      </form>
    </div>
  )
}

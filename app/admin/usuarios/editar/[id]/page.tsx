"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import type { User } from "@prisma/client"
import { Pencil, Trash2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Eye, EyeOff } from "lucide-react"
import { Label } from "@/components/ui/label"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor, introduce un email válido.",
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres.",
  }),
})

const UserEditPage = () => {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const [initialData, setInitialData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")

  useState(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/usuarios/${params.id}`)
        const data = await res.json()

        setInitialData(data)
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: "Failed to fetch user data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, toast])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      password: "",
    },
    mode: "onChange",
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/usuarios/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Usuario editado correctamente.",
        })
        router.refresh()
        router.push("/admin/usuarios")
      } else {
        toast({
          title: "Error",
          description: "Algo salió mal.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Algo salió mal.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/usuarios/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Usuario eliminado correctamente.",
        })
        router.refresh()
        router.push("/admin/usuarios")
      } else {
        toast({
          title: "Error",
          description: "Algo salió mal.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Algo salió mal.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  if (!initialData) {
    return <div>Usuario no encontrado</div>
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            <h2 className="text-3xl font-bold">Editar Usuario</h2>
          </div>
          <Button disabled={loading} onClick={onDelete} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
        <Separator />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="Nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="ejemplo@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Label htmlFor="password">Nueva contraseña (opcional)</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Dejar en blanco para mantener la actual"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-2">
              <Button disabled={loading} type="submit">
                Guardar cambios
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default UserEditPage

"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react"
import { forceChangePassword } from "@/app/actions/auth"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"

// Mapeo de roles a sus dashboards para redirección
const roleDashboards: Record<string, string> = {
  admin: "/admin/dashboard",
  capitan: "/capitan/dashboard",
  director_tecnico: "/director-tecnico/dashboard",
  arbitro: "/arbitro/dashboard",
  supervisor: "/supervisor/dashboard",
  representante: "/representante/dashboard",
}

export default function CambiarContrasenaPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await forceChangePassword(password)

      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
        return
      }

      toast({
        title: "¡Contraseña actualizada!",
        description: "Tu contraseña ha sido cambiada exitosamente.",
      })

      // Actualizar la sesión en el cliente
      await update({ force_password_change: false })

      // Redirigir al dashboard según el rol
      const role = session?.user?.role as string
      const dashboardUrl = roleDashboards[role] || "/"
      
      // Esperar un momento para que el update de la sesión surta efecto completamente
      setTimeout(() => {
        router.push(dashboardUrl)
        router.refresh()
      }, 1000)

    } catch (err: any) {
      setError("Ocurrió un error inesperado al cambiar la contraseña.")
      setIsSubmitting(false)
    }
  }

  if (!session) {
    return null // O un loader mientras carga
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
      <div className="mb-8 relative w-64 h-32">
        <Image 
          src="/super-ganaderia-logo-black.png" 
          alt="Llevo las Riendas" 
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>

      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Cambio Obligatorio</CardTitle>
          <CardDescription className="text-base">
            Por tu seguridad, debes cambiar la contraseña predeterminada antes de continuar.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="Repite tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>Asegúrate de memorizarla. Esta será la contraseña que usarás para ingresar al sistema a partir de ahora.</p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-2">
            <Button 
              type="submit" 
              className="w-full font-bold text-lg h-12" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-gray-500" 
              onClick={() => router.push("/api/auth/signout")}
            >
              Cerrar sesión y volver
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

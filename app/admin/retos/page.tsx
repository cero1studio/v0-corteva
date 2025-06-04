"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, Target, AlertCircle } from "lucide-react"
import { getSystemConfig, updateSystemConfig } from "@/app/actions/system-config"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RetosPage() {
  const [retoText, setRetoText] = useState("")
  const [retoActivo, setRetoActivo] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadCurrentReto()
  }, [])

  async function loadCurrentReto() {
    try {
      setLoading(true)

      // Cargar texto del reto
      const retoResult = await getSystemConfig("reto_actual")
      if (retoResult.success && retoResult.data) {
        setRetoText(retoResult.data)
      }

      // Cargar estado activo del reto
      const activoResult = await getSystemConfig("reto_activo")
      if (activoResult.success && activoResult.data !== null) {
        setRetoActivo(activoResult.data === "true" || activoResult.data === true)
      }
    } catch (error) {
      console.error("Error al cargar reto actual:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Guardar texto del reto
      const retoResult = await updateSystemConfig("reto_actual", retoText)
      if (!retoResult.success) {
        throw new Error(retoResult.error || "Error al guardar el texto del reto")
      }

      // Guardar estado activo del reto
      const activoResult = await updateSystemConfig("reto_activo", retoActivo.toString())
      if (!activoResult.success) {
        throw new Error(activoResult.error || "Error al guardar el estado del reto")
      }

      toast({
        title: "Reto actualizado",
        description: `El reto ha sido ${retoActivo ? "activado" : "desactivado"} y ${retoActivo ? "aparecerá" : "no aparecerá"} en el dashboard de los capitanes.`,
      })
    } catch (error: any) {
      console.error("Error al guardar reto:", error)
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al guardar el reto.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Tiros Libres</h2>
          <p className="text-muted-foreground">
            Crea y gestiona tiros libres que aparecerán en el dashboard de los capitanes
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-corteva-500" />
              Tiro Libre Sin Arquero
            </CardTitle>
            <CardDescription>
              Escribe un tiro libre o desafío que motivará a los capitanes. Este texto aparecerá destacado en su
              dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="reto-activo" checked={retoActivo} onCheckedChange={setRetoActivo} />
                <Label htmlFor="reto-activo" className="text-sm font-medium">
                  {retoActivo ? "Tiro libre activo" : "Tiro libre desactivado"}
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retoText">Texto del Tiro Libre</Label>
                <Textarea
                  id="retoText"
                  value={retoText}
                  onChange={(e) => setRetoText(e.target.value)}
                  placeholder="Ejemplo: ¡Este mes el objetivo es superar las 50 ventas por equipo! ¿Quién será el primero en lograrlo?"
                  rows={6}
                  className="resize-none"
                  disabled={!retoActivo}
                />
                <p className="text-sm text-muted-foreground">{retoText.length}/500 caracteres</p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {retoActivo
                    ? "Este tiro libre aparecerá inmediatamente en el dashboard de todos los capitanes una vez que lo guardes."
                    : "El tiro libre está desactivado y no aparecerá en el dashboard de los capitanes."}
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    "Guardando..."
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Configuración
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
            <CardDescription>Así es como verán el tiro libre los capitanes en su dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {retoActivo ? (
              <div className="border-2 border-dashed border-corteva-200 rounded-lg p-6 bg-corteva-50">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-corteva-500 text-white">
                    <Target className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-corteva-900 mb-2">⚽ Tiro libre sin arquero</h3>
                    <p className="text-corteva-700">
                      {retoText || "Escribe un tiro libre arriba para ver la vista previa..."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="text-center text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Tiro libre desactivado</p>
                  <p className="text-sm">No aparecerá en el dashboard de los capitanes</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

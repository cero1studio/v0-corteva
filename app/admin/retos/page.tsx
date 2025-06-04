"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Save, Target, AlertCircle } from "lucide-react"
import { getSystemConfig, updateSystemConfig } from "@/app/actions/system-config"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RetosPage() {
  const [retoText, setRetoText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadCurrentReto()
  }, [])

  async function loadCurrentReto() {
    try {
      setLoading(true)
      const result = await getSystemConfig("reto_actual")
      if (result.success && result.data) {
        setRetoText(result.data)
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
      const result = await updateSystemConfig("reto_actual", retoText)

      if (result.success) {
        toast({
          title: "Reto actualizado",
          description: "El reto ha sido guardado y aparecerá en el dashboard de los capitanes.",
        })
      } else {
        throw new Error(result.error || "Error al guardar el reto")
      }
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
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Retos</h2>
          <p className="text-muted-foreground">Crea y gestiona retos que aparecerán en el dashboard de los capitanes</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-corteva-500" />
              Reto Actual
            </CardTitle>
            <CardDescription>
              Escribe un reto o desafío que motivará a los capitanes. Este texto aparecerá destacado en su dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retoText">Texto del Reto</Label>
                <Textarea
                  id="retoText"
                  value={retoText}
                  onChange={(e) => setRetoText(e.target.value)}
                  placeholder="Ejemplo: ¡Este mes el objetivo es superar las 50 ventas por equipo! ¿Quién será el primero en lograrlo?"
                  rows={6}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">{retoText.length}/500 caracteres</p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este reto aparecerá inmediatamente en el dashboard de todos los capitanes una vez que lo guardes.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || retoText.length === 0} className="gap-2">
                  {isSubmitting ? (
                    "Guardando..."
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Reto
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
            <CardDescription>Así es como verán el reto los capitanes en su dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-corteva-200 rounded-lg p-6 bg-corteva-50">
              <div className="flex items-start gap-3">
                <div className="rounded-full p-2 bg-corteva-500 text-white">
                  <Target className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-corteva-900 mb-2">🎯 Reto del Mes</h3>
                  <p className="text-corteva-700">{retoText || "Escribe un reto arriba para ver la vista previa..."}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

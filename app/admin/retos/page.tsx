"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Input } from "@/components/ui/input"

export default function RetosPage() {
  const { toast } = useToast()
  const [retoActivo, setRetoActivo] = useState(false)
  const [retoText, setRetoText] = useState("")
  const [retoTitle, setRetoTitle] = useState("")

  const { data: currentChallenge } = useQuery(api.challenges.getChallenge)
  const updateChallenge = useMutation(api.challenges.updateChallenge)

  useEffect(() => {
    if (currentChallenge) {
      setRetoActivo(currentChallenge.isActive)
      setRetoText(currentChallenge.text)
      setRetoTitle(currentChallenge.title)
    }
  }, [currentChallenge])

  const onSave = async () => {
    if (!currentChallenge) return

    try {
      await updateChallenge({
        id: currentChallenge._id,
        text: retoText,
        isActive: retoActivo,
        title: retoTitle,
      })
      toast({
        title: "Reto actualizado!",
        description: "El reto ha sido actualizado correctamente.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Algo salió mal.",
        description: error.message,
      })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Estado del Reto</CardTitle>
          <CardDescription>Activa o desactiva el reto principal del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch id="reto-activo" checked={retoActivo} onCheckedChange={(checked) => setRetoActivo(checked)} />
            <Label htmlFor="reto-activo">Reto Activo</Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Cuando está desactivado, el reto no aparece en los dashboards de los usuarios
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Título del Reto</CardTitle>
          <CardDescription>Escribe el título del reto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={retoTitle} onChange={(e) => setRetoTitle(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Texto del Reto</CardTitle>
          <CardDescription>Escribe el texto que aparecerá en el reto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="text">Texto</Label>
              <Textarea id="text" value={retoText} onChange={(e) => setRetoText(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista Previa</CardTitle>
          <CardDescription>Así se verá el reto en el dashboard de los usuarios</CardDescription>
        </CardHeader>
        <CardContent>
          <Card>
            <CardHeader>
              <CardTitle>{retoTitle || "Título del Reto"}</CardTitle>
            </CardHeader>
            <CardContent>{retoText || "Aquí aparecerá el texto del reto."}</CardContent>
          </Card>
        </CardContent>
      </Card>

      <Button onClick={onSave}>Guardar</Button>
    </div>
  )
}

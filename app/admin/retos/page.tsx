import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function RetosPage() {
  return (
    <div>
      {/* Toggle para activar/desactivar reto */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Reto</CardTitle>
          <CardDescription>Activa o desactiva el reto principal del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch id="reto-activo" defaultChecked />
            <Label htmlFor="reto-activo">Reto Activo</Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Cuando está desactivado, el reto no aparece en los dashboards de los usuarios
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

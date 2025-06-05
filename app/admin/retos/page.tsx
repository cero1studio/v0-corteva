import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

export default function RetosPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Administración de Retos</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Estado del Reto</CardTitle>
          <CardDescription>Activa o desactiva el reto actual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reto Activo</p>
              <p className="text-sm text-muted-foreground">Los equipos pueden ver y participar en el reto</p>
            </div>
            <Switch
              defaultChecked={true}
              onCheckedChange={(checked) => {
                // Aquí puedes agregar la lógica para activar/desactivar
                console.log("Reto activo:", checked)
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Rest of the page content */}
    </div>
  )
}
